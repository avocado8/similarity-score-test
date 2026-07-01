import { supabase } from "../lib/supabaseClient";
import type {
  Submission,
  CreateSubmissionPayload,
  UpdateSubmissionStatusPayload,
} from "../types/submission";

/**
 * 새 제출 데이터 생성
 */
export async function createSubmission(
  payload: CreateSubmissionPayload,
): Promise<Submission> {
  const { data, error } = await supabase
    .from("submissions")
    .insert([
      {
        strokes: payload.strokes,
        submitted_by: payload.submitted_by || null,
        note: payload.note || null,
        status: "pending",
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create submission: ${error.message}`);
  }

  return data as Submission;
}

/**
 * 모든 제출 조회 (필터 옵션 가능)
 */
export async function getSubmissions(options?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<Submission[]> {
  let query = supabase.from("submissions").select("*");

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 10) - 1,
    );
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch submissions: ${error.message}`);
  }

  return (data as Submission[]) || [];
}

/**
 * 특정 제출 조회
 */
export async function getSubmissionById(id: string): Promise<Submission> {
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch submission: ${error.message}`);
  }

  return data as Submission;
}

/**
 * 제출 상태 업데이트 (승인/반려)
 */
export async function updateSubmissionStatus(
  id: string,
  payload: UpdateSubmissionStatusPayload,
): Promise<Submission> {
  const { data, error } = await supabase
    .from("submissions")
    .update({
      status: payload.status,
      rejected_reason: payload.rejected_reason || null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update submission: ${error.message}`);
  }

  return data as Submission;
}

/**
 * 특정 상태의 제출 개수 조회
 */
export async function getSubmissionCount(status?: string): Promise<number> {
  let query = supabase
    .from("submissions")
    .select("id", { count: "exact", head: true });

  if (status) {
    query = query.eq("status", status);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch submission count: ${error.message}`);
  }

  return count || 0;
}

/**
 * 승인된 제출 목록 조회 (내보내기용)
 */
export async function getApprovedSubmissions(): Promise<Submission[]> {
  return getSubmissions({ status: "approved", limit: 1000 });
}
