import { UserRole } from "@prisma/client";
import { z } from "zod";

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "อาจารย์ / ผู้ดูแลระบบ",
  TEACHER: "อาจารย์",
  PARENT: "ผู้ปกครอง",
  LEARNER: "นักเรียน",
};

export const userRoleSchema = z.nativeEnum(UserRole);

export const adminUserPayloadSchema = z.object({
  email: z.string().trim().toLowerCase().email("อีเมลไม่ถูกต้อง"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username ต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(30, "Username ยาวเกินไป")
    .regex(/^[a-z0-9_]+$/, "Username ใช้ได้แค่ a-z, 0-9, _"),
  displayName: z.string().trim().min(1, "กรุณากรอกชื่อ").max(80, "ชื่อยาวเกินไป"),
  role: userRoleSchema,
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  studentIds: z.array(z.string()).optional(),
});

export function adminHomeForRole(role?: string) {
  return role === "ADMIN" || role === "TEACHER";
}
