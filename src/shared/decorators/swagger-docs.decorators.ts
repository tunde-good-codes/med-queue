import { applyDecorators } from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiConsumes,
} from "@nestjs/swagger";

export const ApiAuth = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiResponse({ status: 401, description: "Unauthorized" }),
    ApiResponse({ status: 403, description: "Forbidden" })
  );


export const ApiCreate = (summary: string, dto: any) =>
  applyDecorators(
    ApiOperation({ summary }),
    ApiBody({ type: dto }),
    ApiResponse({ status: 201, description: "Created successfully" }),
    ApiResponse({ status: 400, description: "Bad request" })
  );


  export const ApiPost = (summary: string, dto: any) =>
  applyDecorators(
    ApiOperation({ summary }),
    ApiBody({ type: dto }),
    ApiResponse({ status: 200, description: summary }),
    ApiResponse({ status: 400, description: "Bad request" })
  );


  export const ApiGetService = (summary: string) =>
  applyDecorators(
    ApiOperation({ summary }),
    ApiResponse({ status: 200, description: summary }),
    ApiResponse({ status: 400, description: "Bad request" })
  );

export const ApiVerify = (summary: string, dto: any) =>
  applyDecorators(
    ApiOperation({ summary }),
    ApiBody({ type: dto }),
    ApiResponse({ status: 200, description: "Verified successfully" }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 404, description: "OTP not found or expired" })
  );

export const ApiGetAll = (summary: string) =>
  applyDecorators(
    ApiOperation({ summary }),
    ApiResponse({ status: 200, description: "Fetched successfully" }),
    ApiResponse({ status: 404, description: "Not found" })
  );

export const ApiGetOne = (summary: string) =>
  applyDecorators(
    ApiOperation({ summary }),
    ApiParam({ name: "id", description: "Resource ID" }),
    ApiResponse({ status: 200, description: "Fetched successfully" }),
    ApiResponse({ status: 404, description: "Not found" })
  );

export const ApiUpdateNew = (summary: string, dto: any) =>
  applyDecorators(
    ApiOperation({ summary }),
    ApiBody({ type: dto }),
    ApiResponse({ status: 200, description: summary }),
    ApiResponse({ status: 400, description: "Bad request" }),
    ApiResponse({ status: 404, description: "Not found" })
  );


  export const ApiUpdate = (summary: string, dto: any) =>
  applyDecorators(
    ApiOperation({ summary }),
    ApiParam({ name: "id", description: "Resource ID" }),
    ApiBody({ type: dto }),
    ApiResponse({ status: 200, description: "Updated successfully" }),
    ApiResponse({ status: 404, description: "Not found" })
  );


  export const ApiDelete = (summary: string) =>
  applyDecorators(
    ApiOperation({ summary }),
    ApiParam({ name: "id", description: "Resource ID" }),
    ApiResponse({ status: 200, description: "Deleted successfully" }),
    ApiResponse({ status: 404, description: "Not found" })
  );

// File upload endpoint
export const ApiFileUpload = (summary: string) =>
  applyDecorators(
    ApiOperation({ summary }),
    ApiConsumes("multipart/form-data"),
    ApiResponse({ status: 200, description: summary }),
    ApiResponse({ status: 400, description: "Invalid file" })
  );

// ── Protected combinations (auth + action) ────────────────────────

export const ApiProtectedCreate = (summary: string, dto: any) =>
  applyDecorators(ApiAuth(), ApiCreate(summary, dto));

export const ApiProtectedPost = (summary: string, dto: any) =>
  applyDecorators(ApiAuth(), ApiPost(summary, dto));

export const ApiProtectedGetAll = (summary: string) =>
  applyDecorators(ApiAuth(), ApiGetAll(summary));

export const ApiProtectedGetOne = (summary: string) =>
  applyDecorators(ApiAuth(), ApiGetOne(summary));

export const ApiProtectedUpdate = (summary: string, dto: any) =>
  applyDecorators(ApiAuth(), ApiUpdateNew(summary, dto));

export const ApiProtectedUpdateById = (summary: string, dto: any) =>
  applyDecorators(ApiAuth(), ApiUpdate(summary, dto));

export const ApiProtectedDelete = (summary: string) =>
  applyDecorators(ApiAuth(), ApiDelete(summary));

export const ApiProtectedGetService = (summary: string) =>
  applyDecorators(ApiAuth(), ApiGetService(summary));

export const ApiProtectedFileUpload = (summary: string) =>
  applyDecorators(ApiAuth(), ApiFileUpload(summary));
