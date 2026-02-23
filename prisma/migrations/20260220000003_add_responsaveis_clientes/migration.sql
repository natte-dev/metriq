-- CreateTable: responsaveis
CREATE TABLE `responsaveis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(200) NOT NULL,
    `setor` VARCHAR(200) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: clientes
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(200) NOT NULL,
    `empresa` VARCHAR(200) NULL,
    `cnpj` VARCHAR(20) NULL,
    `telefone` VARCHAR(30) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: cronograma - add UNIQUE, responsavel_id, cliente_id, responsavel_text, cliente_text
ALTER TABLE `cronograma`
    ADD COLUMN `responsavel_id` INTEGER NULL,
    ADD COLUMN `responsavel_text` VARCHAR(200) NULL,
    ADD COLUMN `cliente_id` INTEGER NULL,
    ADD COLUMN `cliente_text` VARCHAR(200) NULL;

ALTER TABLE `cronograma`
    ADD CONSTRAINT `cronograma_responsavel_id_fkey` FOREIGN KEY (`responsavel_id`) REFERENCES `responsaveis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `cronograma_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `cronograma`
    ADD UNIQUE INDEX `cronograma_month_department_id_week_num_key`(`month`, `department_id`, `week_num`);

-- AlterTable: visitas - add generated_from_cronograma_id, responsavel_id, cliente_id, responsavel_text, cliente_text
ALTER TABLE `visitas`
    ADD COLUMN `generated_from_cronograma_id` INTEGER NULL,
    ADD COLUMN `responsavel_id` INTEGER NULL,
    ADD COLUMN `responsavel_text` VARCHAR(200) NULL,
    ADD COLUMN `cliente_id` INTEGER NULL,
    ADD COLUMN `cliente_text` VARCHAR(200) NULL;

ALTER TABLE `visitas`
    ADD CONSTRAINT `visitas_generated_from_cronograma_id_fkey` FOREIGN KEY (`generated_from_cronograma_id`) REFERENCES `cronograma`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `visitas_responsavel_id_fkey` FOREIGN KEY (`responsavel_id`) REFERENCES `responsaveis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `visitas_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: atendimentos - add responsavel_id, cliente_id, responsavel_text, cliente_text
ALTER TABLE `atendimentos`
    ADD COLUMN `responsavel_id` INTEGER NULL,
    ADD COLUMN `responsavel_text` VARCHAR(200) NULL,
    ADD COLUMN `cliente_id` INTEGER NULL,
    ADD COLUMN `cliente_text` VARCHAR(200) NULL;

ALTER TABLE `atendimentos`
    ADD CONSTRAINT `atendimentos_responsavel_id_fkey` FOREIGN KEY (`responsavel_id`) REFERENCES `responsaveis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `atendimentos_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: erros - add responsavel_id, cliente_id, responsavel_text, cliente_text
ALTER TABLE `erros`
    ADD COLUMN `responsavel_id` INTEGER NULL,
    ADD COLUMN `responsavel_text` VARCHAR(200) NULL,
    ADD COLUMN `cliente_id` INTEGER NULL,
    ADD COLUMN `cliente_text` VARCHAR(200) NULL;

ALTER TABLE `erros`
    ADD CONSTRAINT `erros_responsavel_id_fkey` FOREIGN KEY (`responsavel_id`) REFERENCES `responsaveis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `erros_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
