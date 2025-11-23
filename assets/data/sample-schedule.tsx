export interface ScheduleEntry {
  id: string;
  subject: string;
  type: "T" | "P";
  building: string;
  room: string;
  day: "MON" | "TUE" | "WED" | "THU" | "FRI";
  start: number;
  end: number;
}

export interface BasicManualEntry {
  id: string;
  subject: string;
  type: "T" | "P";
  building: string;
  room: string;
}

export const HOURS_MAP: { [key: string]: number } = {
  "8-9": 0,
  "9-10": 1,
  "10-11": 2,
  "11-12": 3,
  "12-13": 4,
  "13-14": 5,
  "14-15": 6,
  "15-16": 7,
  "16-17": 8,
  "17-18": 9,
  "18-19": 10,
  "19-20": 11,
  "20-21": 12,
};

export const DAYS = ["MON", "TUE", "WED", "THU", "FRI"] as const;

// export const SAMPLE_SCHEDULE: ScheduleEntry[] = [
//   {
//     id: "1",
//     subject: "MSP",
//     type: "T",
//     building: "II",
//     room: "128",
//     day: "WED",
//     // hourIndex: HOURS_MAP["9-10"],
//     duration: 2,
//   },
//   {
//     id: "2",
//     subject: "SBD",
//     type: "T",
//     building: "II",
//     room: "128",
//     day: "WED",
//     hourIndex: HOURS_MAP["11-12"],
//     duration: 2,
//   },
//   {
//     id: "3",
//     subject: "MSP",
//     type: "P",
//     building: "II",
//     room: "Lab. 119",
//     day: "THU",
//     hourIndex: HOURS_MAP["11-12"],
//     duration: 2,
//   },
//   {
//     id: "4",
//     subject: "IPM",
//     type: "T",
//     building: "VII",
//     room: "2A",
//     day: "MON",
//     hourIndex: HOURS_MAP["14-15"],
//     duration: 2,
//   },
//   {
//     id: "5",
//     subject: "SBD",
//     type: "P",
//     building: "II",
//     room: "Lab. 120",
//     day: "WED",
//     hourIndex: HOURS_MAP["14-15"],
//     duration: 2,
//   },
//   {
//     id: "6",
//     subject: "IPM",
//     type: "P",
//     building: "II",
//     room: "Lab. 120",
//     day: "MON",
//     hourIndex: HOURS_MAP["16-17"],
//     duration: 2,
//   },
// ];
