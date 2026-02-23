-- CreateTable
CREATE TABLE `departments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `months` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `value` CHAR(7) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `months_value_key`(`value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `status_visita` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `semanas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `number` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `value` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipo_erro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `penalty_points` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `app_params` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `meta_visitas_mes` INTEGER NOT NULL DEFAULT 4,
    `escala_atendimento_max` DECIMAL(5, 2) NOT NULL DEFAULT 5,
    `peso_visitacao` DECIMAL(5, 4) NOT NULL DEFAULT 0.40,
    `peso_atendimento` DECIMAL(5, 4) NOT NULL DEFAULT 0.35,
    `peso_qualidade` DECIMAL(5, 4) NOT NULL DEFAULT 0.25,
    `bonus_trimestral` DECIMAL(10, 2) NOT NULL DEFAULT 150.00,
    `bonus_semestral` DECIMAL(10, 2) NOT NULL DEFAULT 300.00,
    `bonus_anual` DECIMAL(10, 2) NOT NULL DEFAULT 300.00,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cronograma` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `month` CHAR(7) NOT NULL,
    `department_id` INTEGER NOT NULL,
    `week_num` INTEGER NOT NULL,
    `cliente` VARCHAR(200) NULL,
    `data_agendada` DATE NULL,
    `responsavel` VARCHAR(200) NULL,
    `observacoes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `department_id` INTEGER NOT NULL,
    `month` CHAR(7) NOT NULL,
    `week_id` INTEGER NOT NULL,
    `status_id` INTEGER NOT NULL,
    `responsavel_nome` VARCHAR(200) NULL,
    `responsavel_setor` VARCHAR(200) NULL,
    `responsavel_tempo` VARCHAR(100) NULL,
    `cliente` VARCHAR(200) NULL,
    `data_agendada` DATE NULL,
    `data_realizada` DATE NULL,
    `ata_anexada` BOOLEAN NOT NULL DEFAULT false,
    `pendencias_criadas` BOOLEAN NOT NULL DEFAULT false,
    `pendencias_prazo` BOOLEAN NOT NULL DEFAULT false,
    `observacoes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `atendimentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `department_id` INTEGER NOT NULL,
    `month` CHAR(7) NOT NULL,
    `responsavel` VARCHAR(200) NULL,
    `cliente` VARCHAR(200) NULL,
    `data` DATE NULL,
    `nota_id` INTEGER NOT NULL,
    `sla_prazo` BOOLEAN NOT NULL DEFAULT true,
    `comentario` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `erros` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `department_id` INTEGER NOT NULL,
    `month` CHAR(7) NOT NULL,
    `responsavel` VARCHAR(200) NULL,
    `cliente` VARCHAR(200) NULL,
    `data` DATE NULL,
    `tipo_erro_id` INTEGER NOT NULL,
    `penalty_points_override` INTEGER NULL,
    `descricao` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cronograma` ADD CONSTRAINT `cronograma_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_week_id_fkey` FOREIGN KEY (`week_id`) REFERENCES `semanas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `status_visita`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `atendimentos` ADD CONSTRAINT `atendimentos_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `atendimentos` ADD CONSTRAINT `atendimentos_nota_id_fkey` FOREIGN KEY (`nota_id`) REFERENCES `notas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erros` ADD CONSTRAINT `erros_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erros` ADD CONSTRAINT `erros_tipo_erro_id_fkey` FOREIGN KEY (`tipo_erro_id`) REFERENCES `tipo_erro`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
