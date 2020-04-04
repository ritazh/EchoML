import { S3BlobContainer } from "../S3BlobContainer";

describe("S3BlobService", () => {
  it("lists buckets", () => {
    const listObjectsV2 = (_params: any, cb: any) => cb(null, { CommonPrefixes: ["one", "two"] });
    jest.doMock(
      "aws-sdk/clients/s3",
      () =>
        function S3() {
          return {
            listObjectsV2,
          };
        },
    );

    const S3BlobService = require("../S3BlobService").S3BlobService;

    const secret = "sekret";
    const accessKey = "key";
    const subject = new S3BlobService(secret, accessKey);

    const expectedContainers: S3BlobContainer[] = [
      new S3BlobContainer(S3BlobService, "one", "bucket"),
      new S3BlobContainer(S3BlobService, "two", "bucket"),
    ];

    return subject.getContainers().then((result: S3BlobContainer[]) => {
      expect(result).toEqual(expectedContainers);
    });
  });
});
