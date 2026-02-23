-- CreateTable department_auth
-- Stores bcrypt-hashed passwords for each department (coord login)
CREATE TABLE `department_auth` (
    `department_id` INTEGER NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`department_id`),
    CONSTRAINT `department_auth_department_id_fkey`
        FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
