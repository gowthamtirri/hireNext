import { DataTypes } from "sequelize";
import { sequelize } from "../models";
import { logger } from "./logger";

/**
 * Lightweight, idempotent schema guards for environments that already have data.
 * SQLite cannot alter tables in-place when duplicate values violate constraints,
 * so we add/patch columns manually before Sequelize sync runs.
 */
export const ensureCandidateCreatedByColumn = async () => {
  const queryInterface = sequelize.getQueryInterface();

  try {
    const tableDefinition = await queryInterface.describeTable("candidates");

    if (tableDefinition.created_by) {
      return; // Column already exists
    }

    logger.info("Adding candidates.created_by column (vendor support)");

    await queryInterface.addColumn("candidates", "created_by", {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "SET NULL",
    });

    // Backfill existing records so legacy candidate accounts continue to work
    await queryInterface.sequelize.query(
      "UPDATE candidates SET created_by = user_id WHERE created_by IS NULL"
    );

    logger.info("candidates.created_by column created and backfilled");
  } catch (error) {
    logger.error("ensureCandidateCreatedByColumn failed", error);
    throw error;
  }
};

