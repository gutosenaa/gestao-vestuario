import fs from 'node:fs';
const path = '/home/ubuntu/gestao-vestuario/server/routers/commerce.ts';
let s = fs.readFileSync(path, 'utf8');
const helperAnchor = 'function makeProductCode(lastCode?: string | null) {\n  const previous = Number(lastCode?.replace("COD", "") ?? 0);\n  return `COD${String(previous + 1).padStart(3, "0")}`;\n}\n';
if (!s.includes(helperAnchor)) throw new Error('helper anchor missing');
if (!s.includes('const MAX_PRODUCT_IMAGE_BYTES')) {
  const helper = helperAnchor + '\nconst MAX_PRODUCT_IMAGE_BYTES = 4_000_000;\n\nfunction decodeProductImage(imageDataUrl?: string) {\n  if (!imageDataUrl) return null;\n  const match = imageDataUrl.match(/^data:(image\\/[a-zA-Z0-9.+-]+);base64,(.+)$/);\n  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "A imagem enviada é inválida." });\n  const bytes = Buffer.from(match[2], "base64");\n  if (bytes.length > MAX_PRODUCT_IMAGE_BYTES) throw new TRPCError({ code: "BAD_REQUEST", message: "A imagem deve ter no máximo 4 MB." });\n  return { mimeType: match[1], extension: match[1].split("/")[1].replace("jpeg", "jpg"), bytes };\n}\n\nasync function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {\n  let timer: ReturnType<typeof setTimeout> | undefined;\n  try {\n    return await Promise.race([promise, new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error("storage-timeout")), timeoutMs); })]);\n  } finally {\n    if (timer) clearTimeout(timer);\n  }\n}\n';
  s = s.replace(helperAnchor, helper);
}
const start = s.indexOf('    create: protectedProcedure.input', s.indexOf('products: router({'));
const end = s.indexOf('    update: protectedProcedure.input', start);
if (start < 0 || end < 0) throw new Error('products.create bounds missing');
let block = s.slice(start, end);
if (!block.includes('const image = decodeProductImage')) block = block.replace('      const { imageDataUrl, initialQuantity, initialUnitCostCents, ...productInput } = input;\n      const values =', '      const { imageDataUrl, initialQuantity, initialUnitCostCents, ...productInput } = input;\n      const image = decodeProductImage(imageDataUrl);\n      const values =');
const uploadStart = block.indexOf('      if (imageDataUrl) {');
const uploadEnd = block.indexOf('      if (initialQuantity > 0) {', uploadStart);
if (uploadStart >= 0 && uploadEnd > uploadStart) {
  const newUpload = '      let imageUploadFailed = false;\n      if (image) {\n        try {\n          const stored = await withTimeout(storagePut(`products/${id}/${nanoid(12)}.${image.extension}`, image.bytes, image.mimeType), 8000);\n          await db.update(products).set({ imageKey: stored.key, imageUrl: stored.url }).where(eq(products.id, id));\n        } catch (error) {\n          imageUploadFailed = true;\n          console.warn(`[ProductCreate] image upload skipped for ${id}:`, error);\n        }\n      }\n';
  block = block.slice(0, uploadStart) + newUpload + block.slice(uploadEnd);
}
block = block.replace('      return { id, code };', '      return { id, code, imageUploadFailed };');
s = s.slice(0, start) + block + s.slice(end);
fs.writeFileSync(path, s);
console.log('products.create endurecido com limite real e timeout de storage.');
