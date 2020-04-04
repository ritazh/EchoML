const S3 = require("aws-sdk/clients/s3");
import S3Type from "aws-sdk/clients/s3";
import { AWSError } from "aws-sdk/lib/error";
import { Request } from "aws-sdk/lib/request";
import { Service } from "aws-sdk/lib/service";
import { mocked } from "ts-jest/utils";
import { S3BlobContainer } from "../S3BlobContainer";
import { S3BlobFile } from "../S3BlobFile";
import { S3BlobService } from "../S3BlobService";

xdescribe("S3Bucket", () => {
  describe("#getBlobs", () => {
    it("returns blobs", () => {
      const service = mocked(new S3BlobService("foo", "bar", "baz"));
      const fakeS3 = mocked(new S3() as S3Type);
      fakeS3.listObjectsV2.mockImplementation(callback => {
        callback
          ? callback(mocked({} as AWSError), { Contents: [{ Key: "foo", Size: 123 }] })
          : undefined;
        return new Request(mocked(new Service()), "", {});
      });
      // @ts-ignore
      service.service = fakeS3;

      const bucket = "foobar";
      // @ts-ignore
      const subject = new S3BlobContainer(service, bucket);
      const blob1: S3BlobFile = new S3BlobFile(subject, { Key: "foo", Size: 123 });
      const expectedBlobs = [blob1];

      // @ts-ignore
      return subject.getBlobs().then(blobs => {
        expect(blobs).toEqual(expectedBlobs);
      });
    });
  });
});
