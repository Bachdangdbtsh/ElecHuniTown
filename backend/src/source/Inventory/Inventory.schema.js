import { z } from "zod";

const dateOnly = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}, "Ngày phải hợp lệ và có dạng YYYY-MM-DD");

const positiveId = z.coerce
  .number()
  .int()
  .min(1, "ID phải là số nguyên dương")
  .max(2147483647);
const quantity = z
  .number()
  .int()
  .min(1, "Số lượng phải là số nguyên dương")
  .max(2147483647);
const unitCost = z
  .number()
  .int()
  .min(0, "Đơn giá không được âm")
  .max(2147483647);

function uniqueProductIds(items, context) {
  const ids = items.map((item) => item.productId);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({
      code: "custom",
      message: "Mỗi sản phẩm chỉ được xuất hiện một lần trong phiếu",
    });
  }
}

const itemList = z
  .array(
    z.object({
      productId: positiveId,
      quantity,
    }),
  )
  .min(1, "Phiếu phải có ít nhất một sản phẩm");

export const inventoryQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).max(2147483647).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const supplierListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  searchBy: z.enum(['all', 'name', 'businessRegistNum', 'phoneNumber']).default('all'),
  page: z.coerce.number().int().min(1).max(2147483647).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(4),
});

export const supplierSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên nhà cung cấp').max(150),
  businessRegistNum: z.string().trim().min(1, 'Vui lòng nhập mã doanh nghiệp').max(50),
  address: z.string().trim().min(1, 'Vui lòng nhập địa chỉ').max(500),
  phoneNumber: z.string().trim().min(8, 'Số điện thoại không hợp lệ').max(30),
  email: z.string().trim().email('Email liên hệ không hợp lệ').max(254),
  contactPerson: z.string().trim().min(1, 'Vui lòng nhập người đại diện').max(150),
  bankNumber: z.string().trim().min(1, 'Vui lòng nhập số tài khoản ngân hàng').max(50),
  bankName: z.string().trim().min(1, 'Vui lòng nhập tên viết tắt ngân hàng').max(50),
});

export const documentListQuerySchema = z
  .object({
    status: z
      .enum(["DRAFT", "PENDING_HANDLE", "APPROVED", "DENIED"])
      .optional(),
    supplierId: positiveId.optional(),
    from: dateOnly.optional(),
    to: dateOnly.optional(),
    page: z.coerce.number().int().min(1).max(2147483647).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: "Ngày bắt đầu không được sau ngày kết thúc",
    path: ["from"],
  });

export const createReceiptSchema = z.object({
  supplierId: positiveId,
  content: z
    .string()
    .trim()
    .min(1, "Nội dung phiếu không được để trống")
    .max(2000),
  items: z
    .array(
      z.object({
        productId: positiveId,
        quantity,
        unitCost,
      }),
    )
    .min(1, "Phiếu phải có ít nhất một sản phẩm")
    .superRefine(uniqueProductIds),
});

export const createIssueSchema = z
  .object({
    supplierId: positiveId.optional(),
    type: z.enum(["SALE", "DAMAGED", "RETURN_TO_SUPPLIER"]).default("SALE"),
    content: z
      .string()
      .trim()
      .min(1, "Nội dung phiếu không được để trống")
      .max(2000),
    items: itemList.superRefine(uniqueProductIds),
  })
  .refine(
    (document) => document.type !== "RETURN_TO_SUPPLIER" || document.supplierId,
    {
      message: "Phiếu trả hàng nhà cung cấp cần có nhà cung cấp",
      path: ["supplierId"],
    },
  );

export const rejectDocumentSchema = z.object({
  rejectReason: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập lý do từ chối")
    .max(1000),
});

export const emptyActionSchema = z.object({});
