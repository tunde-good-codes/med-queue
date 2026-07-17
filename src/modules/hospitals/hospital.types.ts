export enum FacilityType {
  GENERAL_HOSPITAL = 'GENERAL_HOSPITAL',
  SPECIALIST_CLINIC = 'SPECIALIST_CLINIC',
  URGENT_CARE = 'URGENT_CARE',
  DIAGNOSTIC_LAB = 'DIAGNOSTIC_LAB',
}

export interface OperatingHourDay {
  isOpen: boolean;
  openTime: string; // HH:MM formatting (e.g., "08:00")
  closeTime: string; // HH:MM formatting (e.g., "18:00")
}

export interface WeeklySchedule {
  monday: OperatingHourDay;
  tuesday: OperatingHourDay;
  wednesday: OperatingHourDay;
  thursday: OperatingHourDay;
  friday: OperatingHourDay;
  saturday: OperatingHourDay;
  sunday: OperatingHourDay;
}