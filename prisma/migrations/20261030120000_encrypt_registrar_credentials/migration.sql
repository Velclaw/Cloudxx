-- Additive credential storage. Existing registrar metadata remains unchanged.
ALTER TABLE "Registrar" ADD COLUMN "encryptedCredentials" TEXT;
