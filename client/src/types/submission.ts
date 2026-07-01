import type { Stroke } from "../config/types";

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface Submission {
  id: string;
  created_at: string;
  status: SubmissionStatus;
  strokes: Stroke[];
  submitted_by?: string;
  note?: string;
  rejected_reason?: string;
  reviewed_at?: string;
  updated_at: string;
}

export interface CreateSubmissionPayload {
  strokes: Stroke[];
  submitted_by?: string;
  note?: string;
}

export interface UpdateSubmissionStatusPayload {
  status: SubmissionStatus;
  rejected_reason?: string;
}
