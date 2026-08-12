import { students, classes, homework, payments, notices } from "@/data/mockData";

export const mockQueries = {
  students: () => students,
  classes: () => classes,
  homework: () => homework,
  payments: () => payments,
  notices: () => notices
};
