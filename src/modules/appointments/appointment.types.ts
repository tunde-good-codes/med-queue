export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum AppointmentPaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  REFUNDED = 'refunded',
  PENDING = 'pending',
}

export const AppointmentTransitions: Record<
  AppointmentStatus,
  AppointmentStatus[]
> = {
  [AppointmentStatus.PENDING]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CANCELLED,
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.CANCELLED,

    AppointmentStatus.NO_SHOW,
  ],

  [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};
