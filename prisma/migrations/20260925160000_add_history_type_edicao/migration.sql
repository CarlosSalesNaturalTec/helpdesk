-- AlterEnum
-- Aditivo: a revisão anterior nunca produz nem lê o valor novo, então o rollout é seguro.
ALTER TYPE "HistoryType" ADD VALUE 'EDICAO';
