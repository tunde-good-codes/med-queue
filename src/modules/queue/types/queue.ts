export enum QueueStatus {
  WAITING = 'waiting',
  CALLED = 'called',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  SKIPPED = 'skipped',
}

export const QUEUE_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  [QueueStatus.WAITING]: [QueueStatus.CALLED],
  [QueueStatus.CALLED]: [QueueStatus.IN_PROGRESS, QueueStatus.SKIPPED],
  [QueueStatus.IN_PROGRESS]: [QueueStatus.DONE],
  [QueueStatus.DONE]: [],
  [QueueStatus.SKIPPED]: [QueueStatus.WAITING],
};