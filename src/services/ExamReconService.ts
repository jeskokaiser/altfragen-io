import { supabase } from '@/integrations/supabase/client';
import type {
  ExamReconAssignmentTask,
  ExamReconCanonicalQuestion,
  ExamReconComment,
  ExamReconPresence,
  ExamReconPresenceStatus,
  ExamReconQuestionDraft,
  ExamReconVariant,
  ExamReconVariantSlot,
  ExamReconWorkspace,
  ExamReconWorkspaceStatus,
  ExamReconDraftContent,
} from '@/types/ExamRecon';

// NOTE: The Supabase generated Database types do not currently include exam_recon_* tables
// in this repo (migrations are local). For now we use an untyped PostgREST client surface.
const sb = supabase as any;

// Helper to ensure session is available before making queries
// This ensures the JWT token is attached to requests for RLS policies
// The Supabase client should automatically attach the JWT, but we ensure the session is loaded and valid
async function ensureSession() {
  try {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      // Try to get user instead, which will trigger session refresh if needed
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.warn('No active session or user - RLS policies may deny access');
        return null;
      }
      // If we have a user but no session, try to refresh
      const { data: { session: refreshedSession } } = await supabase.auth.getSession();
      return refreshedSession;
    }
    
    if (!session) {
      console.warn('No active session - RLS policies may deny access');
      return null;
    }
    
    // Verify the session is still valid by checking the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.warn('Session exists but user is invalid - RLS policies may deny access');
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error ensuring session:', error);
    return null;
  }
}

export class ExamReconService {
  // ---------------------------------------------------------------------------
  // Workspace CRUD
  // ---------------------------------------------------------------------------
  static async getWorkspace(workspaceId: string): Promise<ExamReconWorkspace> {
    // Ensure session is loaded before querying
    await ensureSession();
    const { data, error } = await sb
      .from('exam_recon_workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();
    if (error) throw error;
    return data as ExamReconWorkspace;
  }

  static async listWorkspaces(): Promise<ExamReconWorkspace[]> {
    // Ensure session is loaded before querying
    await ensureSession();
    const { data, error } = await sb
      .from('exam_recon_workspaces')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ExamReconWorkspace[];
  }

  static async createWorkspace(input: {
    university_id: string;
    title: string;
    subject: string;
    exam_term?: string | null;
    exam_year?: number | null;
    created_by: string;
    status?: ExamReconWorkspaceStatus;
    due_at: string;
    dataset_filename: string;
    dataset_semester?: string | null;
    dataset_year?: string | null;
    dataset_subject?: string | null;
  }): Promise<ExamReconWorkspace> {
    // Ensure session is loaded before querying
    await ensureSession();
    const { data, error } = await sb
      .from('exam_recon_workspaces')
      .insert({
        university_id: input.university_id,
        title: input.title,
        subject: input.subject,
        exam_term: input.exam_term ?? null,
        exam_year: input.exam_year ?? null,
        created_by: input.created_by,
        status: input.status ?? 'draft',
        due_at: input.due_at,
        dataset_filename: input.dataset_filename,
        dataset_semester: input.dataset_semester ?? null,
        dataset_year: input.dataset_year ?? null,
        dataset_subject: input.dataset_subject ?? null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as ExamReconWorkspace;
  }

  static async setWorkspaceStatus(workspaceId: string, status: ExamReconWorkspaceStatus): Promise<void> {
    const { error } = await sb
      .from('exam_recon_workspaces')
      .update({ status, published_at: status === 'published' ? new Date().toISOString() : null })
      .eq('id', workspaceId);
    if (error) throw error;
  }

  // ---------------------------------------------------------------------------
  // Membership
  // ---------------------------------------------------------------------------
  static async addSelfAsModerator(workspaceId: string, userId: string): Promise<void> {
    const { error } = await sb.from('exam_recon_memberships').insert({
      workspace_id: workspaceId,
      user_id: userId,
      role: 'moderator',
      active: true,
    });
    if (error) throw error;
  }

  static async listMembers(workspaceId: string) {
    const { data, error } = await sb
      .from('exam_recon_memberships')
      .select('*')
      .eq('workspace_id', workspaceId);
    if (error) throw error;
    return data ?? [];
  }

  // ---------------------------------------------------------------------------
  // Variants + slots setup
  // ---------------------------------------------------------------------------
  static async createVariant(input: {
    workspace_id: string;
    code: string;
    display_name?: string | null;
    question_count: number;
  }): Promise<ExamReconVariant> {
    const { data, error } = await sb
      .from('exam_recon_variants')
      .insert({
        workspace_id: input.workspace_id,
        code: input.code,
        display_name: input.display_name ?? null,
        question_count: input.question_count,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as ExamReconVariant;
  }

  static async listVariants(workspaceId: string): Promise<ExamReconVariant[]> {
    const { data, error } = await sb
      .from('exam_recon_variants')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('code', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ExamReconVariant[];
  }

  static async bulkCreateSlots(variantId: string, questionCount: number): Promise<void> {
    const rows = Array.from({ length: questionCount }, (_, i) => ({
      variant_id: variantId,
      slot_number: i + 1,
      status: 'unassigned',
    }));
    const { error } = await sb.from('exam_recon_variant_slots').insert(rows);
    if (error) throw error;
  }

  static async listSlotsByVariant(variantId: string): Promise<ExamReconVariantSlot[]> {
    const { data, error } = await sb
      .from('exam_recon_variant_slots')
      .select('*')
      .eq('variant_id', variantId)
      .order('slot_number', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ExamReconVariantSlot[];
  }

  static async listAllSlotsForWorkspace(workspaceId: string): Promise<ExamReconVariantSlot[]> {
    const variants = await this.listVariants(workspaceId);
    const all: ExamReconVariantSlot[] = [];
    for (const v of variants) {
      const slots = await this.listSlotsByVariant(v.id);
      all.push(...slots);
    }
    return all;
  }

  static async listTasks(workspaceId: string): Promise<ExamReconAssignmentTask[]> {
    const { data, error } = await sb
      .from('exam_recon_assignment_tasks')
      .select('*')
      .eq('workspace_id', workspaceId);
    if (error) throw error;
    return (data ?? []) as ExamReconAssignmentTask[];
  }

  static async getSlot(slotId: string): Promise<ExamReconVariantSlot> {
    const { data, error } = await sb
      .from('exam_recon_variant_slots')
      .select('*')
      .eq('id', slotId)
      .single();
    if (error) throw error;
    return data as ExamReconVariantSlot;
  }

  // ---------------------------------------------------------------------------
  // Canonical + draft (optimistic concurrency)
  // ---------------------------------------------------------------------------
  static async createCanonicalQuestion(input: {
    workspace_id: string;
    created_by: string;
    question_type?: string;
  }): Promise<ExamReconCanonicalQuestion> {
    const { data, error } = await sb
      .from('exam_recon_canonical_questions')
      .insert({
        workspace_id: input.workspace_id,
        created_by: input.created_by,
        question_type: input.question_type ?? 'unknown',
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as ExamReconCanonicalQuestion;
  }

  static async getCanonicalQuestion(canonicalId: string): Promise<ExamReconCanonicalQuestion> {
    const { data, error } = await sb
      .from('exam_recon_canonical_questions')
      .select('*')
      .eq('id', canonicalId)
      .single();
    if (error) throw error;
    return data as ExamReconCanonicalQuestion;
  }

  // ---------------------------------------------------------------------------
  // Duplicate detection + merge/split (RPC)
  // ---------------------------------------------------------------------------
  static async findSimilarCanonicals(params: {
    workspaceId: string;
    canonicalId: string;
    threshold?: number;
    limit?: number;
  }): Promise<Array<{ candidate_id: string; similarity: number; normalized_prompt: string; prompt_hash: string | null }>> {
    const { data, error } = await sb.rpc('exam_recon_find_similar_canonicals', {
      p_workspace_id: params.workspaceId,
      p_canonical_id: params.canonicalId,
      p_threshold: params.threshold ?? 0.7,
      p_limit: params.limit ?? 10,
    });
    if (error) throw error;
    return (data ?? []) as Array<{ candidate_id: string; similarity: number; normalized_prompt: string; prompt_hash: string | null }>;
  }

  static async mergeCanonicals(params: { from: string; to: string; reason?: string | null }): Promise<void> {
    const { error } = await sb.rpc('exam_recon_merge_canonicals', {
      p_from: params.from,
      p_to: params.to,
      p_reason: params.reason ?? null,
    });
    if (error) throw error;
  }

  static async createSplitCanonical(params: { from: string }): Promise<string> {
    const { data, error } = await sb.rpc('exam_recon_create_split_canonical', {
      p_from: params.from,
      p_created_by: null,
    });
    if (error) throw error;
    return data as string;
  }

  static async splitMoveSlots(params: { from: string; to: string; slotIds: string[]; reason?: string | null }): Promise<void> {
    const { error } = await sb.rpc('exam_recon_split_move_slots', {
      p_from: params.from,
      p_new: params.to,
      p_slot_ids: params.slotIds,
      p_reason: params.reason ?? null,
    });
    if (error) throw error;
  }

  static async linkSlotToCanonical(slotId: string, canonicalId: string): Promise<void> {
    const { error } = await sb
      .from('exam_recon_variant_slots')
      .update({ canonical_question_id: canonicalId, status: 'in_progress' })
      .eq('id', slotId);
    if (error) throw error;
  }

  static async setSlotStatus(slotId: string, status: string): Promise<void> {
    const { error } = await sb.from('exam_recon_variant_slots').update({ status }).eq('id', slotId);
    if (error) throw error;
  }

  static async setTaskStatusBySlot(slotId: string, status: string): Promise<void> {
    const { error } = await sb
      .from('exam_recon_assignment_tasks')
      .update({ status, updated_at: new Date().toISOString(), completed_at: status === 'done' ? new Date().toISOString() : null })
      .eq('slot_id', slotId);
    if (error) throw error;
  }

  // ---------------------------------------------------------------------------
  // Attachments (Supabase Storage)
  // ---------------------------------------------------------------------------
  static async uploadAttachment(params: {
    workspaceId: string;
    canonicalId: string;
    file: File;
  }): Promise<{ storage_path: string }> {
    const ext = params.file.name.split('.').pop() || 'bin';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const path = `exam-recon/${params.workspaceId}/${params.canonicalId}/${filename}`;
    const { error } = await supabase.storage.from('exam-images').upload(path, params.file, {
      upsert: false,
      contentType: params.file.type || undefined,
    });
    if (error) throw error;
    return { storage_path: path };
  }

  static async createSignedUrl(storagePath: string, expiresInSeconds: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage.from('exam-images').createSignedUrl(storagePath, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
  }

  static async getDraft(canonicalId: string): Promise<ExamReconQuestionDraft | null> {
    const { data, error } = await sb
      .from('exam_recon_question_drafts')
      .select('*')
      .eq('canonical_question_id', canonicalId)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as ExamReconQuestionDraft | null;
  }

  static async upsertDraft(canonicalId: string, editorUserId: string, content: ExamReconDraftContent) {
    const { data, error } = await sb
      .from('exam_recon_question_drafts')
      .upsert({
        canonical_question_id: canonicalId,
        content,
        last_edited_by: editorUserId,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as ExamReconQuestionDraft;
  }

  // Optimistic update: succeeds only if revision matches.
  static async updateDraftOptimistic(params: {
    canonicalId: string;
    editorUserId: string;
    prevRevision: number;
    nextContent: ExamReconDraftContent;
  }): Promise<{ ok: true; draft: ExamReconQuestionDraft } | { ok: false; conflict: true }> {
    const { data, error } = await sb
      .from('exam_recon_question_drafts')
      .update({
        content: params.nextContent,
        revision: params.prevRevision + 1,
        last_edited_by: params.editorUserId,
      })
      .eq('canonical_question_id', params.canonicalId)
      .eq('revision', params.prevRevision)
      .select('*');

    if (error) throw error;
    if (!data || data.length === 0) return { ok: false, conflict: true };
    return { ok: true, draft: data[0] as ExamReconQuestionDraft };
  }

  // ---------------------------------------------------------------------------
  // Comments
  // ---------------------------------------------------------------------------
  static async listComments(canonicalId: string): Promise<ExamReconComment[]> {
    const { data, error } = await sb
      .from('exam_recon_comments')
      .select('*')
      .eq('canonical_question_id', canonicalId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ExamReconComment[];
  }

  static async addComment(input: {
    canonical_question_id: string;
    user_id: string;
    content: string;
    parent_id?: string | null;
  }): Promise<ExamReconComment> {
    const { data, error } = await sb
      .from('exam_recon_comments')
      .insert({
        canonical_question_id: input.canonical_question_id,
        user_id: input.user_id,
        content: input.content,
        parent_id: input.parent_id ?? null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as ExamReconComment;
  }

  // ---------------------------------------------------------------------------
  // Votes
  // ---------------------------------------------------------------------------
  static async listVotes(canonicalId: string) {
    const { data, error } = await sb
      .from('exam_recon_votes')
      .select('*')
      .eq('canonical_question_id', canonicalId);
    if (error) throw error;
    return data ?? [];
  }

  static async upsertMcqVote(input: { canonical_question_id: string; user_id: string; mcq_choice: string }) {
    const { data, error } = await sb
      .from('exam_recon_votes')
      .upsert(
        {
          canonical_question_id: input.canonical_question_id,
          user_id: input.user_id,
          vote_kind: 'mcq',
          mcq_choice: input.mcq_choice,
          free_text_answer: null,
        },
        { onConflict: 'canonical_question_id,user_id,vote_kind' }
      )
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  static async upsertFreeTextVote(input: { canonical_question_id: string; user_id: string; free_text_answer: string }) {
    const { data, error } = await sb
      .from('exam_recon_votes')
      .upsert(
        {
          canonical_question_id: input.canonical_question_id,
          user_id: input.user_id,
          vote_kind: 'free_text',
          mcq_choice: null,
          free_text_answer: input.free_text_answer,
        },
        { onConflict: 'canonical_question_id,user_id,vote_kind' }
      )
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  // ---------------------------------------------------------------------------
  // Presence (DB-enforced)
  // ---------------------------------------------------------------------------
  static async upsertPresence(input: {
    workspace_id: string;
    canonical_question_id?: string | null;
    user_id: string;
    status: ExamReconPresenceStatus;
    meta?: Record<string, unknown>;
  }): Promise<ExamReconPresence> {
    try {
      // First try to update existing record
      const { data: existing, error: fetchError } = await sb
        .from('exam_recon_presence')
        .select('*')
        .eq('workspace_id', input.workspace_id)
        .eq('user_id', input.user_id)
        .eq('canonical_question_id', input.canonical_question_id ?? null)
        .maybeSingle();
      
      if (existing) {
        // Update existing record
        const { data: updated, error: updateError } = await sb
          .from('exam_recon_presence')
          .update({
            status: input.status,
            last_heartbeat_at: new Date().toISOString(),
            meta: input.meta ?? {},
          })
          .eq('id', existing.id)
          .select('*')
          .single();
        if (updateError) throw updateError;
        return updated as ExamReconPresence;
      } else {
        // Insert new record
        const { data, error } = await sb
          .from('exam_recon_presence')
          .insert({
            workspace_id: input.workspace_id,
            canonical_question_id: input.canonical_question_id ?? null,
            user_id: input.user_id,
            status: input.status,
            last_heartbeat_at: new Date().toISOString(),
            meta: input.meta ?? {},
          })
          .select('*')
          .single();
        if (error) throw error;
        return data as ExamReconPresence;
      }
    } catch (error: any) {
      // Silently ignore 409 conflicts - presence is non-critical for functionality
      // This can happen due to race conditions when multiple tabs/heartbeats occur simultaneously
      if (error?.code === '23505' || error?.status === 409 || error?.code === 'PGRST204') {
        // Return a dummy presence object to prevent errors
        return {
          id: '',
          workspace_id: input.workspace_id,
          canonical_question_id: input.canonical_question_id ?? null,
          user_id: input.user_id,
          status: input.status,
          last_heartbeat_at: new Date().toISOString(),
          meta: input.meta ?? {},
        } as ExamReconPresence;
      }
      // For other errors, still throw
      throw error;
    }
  }

  static async listPresenceStatusesForQuestion(canonicalId: string): Promise<Array<{ status: string }>> {
    const { data, error } = await sb.from('exam_recon_presence').select('status').eq('canonical_question_id', canonicalId);
    if (error) throw error;
    return (data ?? []) as Array<{ status: string }>;
  }

  // ---------------------------------------------------------------------------
  // Assignment (RPC)
  // ---------------------------------------------------------------------------
  static async runAssignment(workspaceId: string, seed?: string): Promise<string> {
    const { data, error } = await sb.rpc('exam_recon_assign_tasks', {
      p_workspace_id: workspaceId,
      p_seed: seed ?? null,
    });
    if (error) throw error;
    return data as string;
  }

  static async markStaleTasks(workspaceId: string, staleAfterHours: number = 24): Promise<number> {
    const { data, error } = await sb.rpc('exam_recon_mark_stale_tasks', {
      p_workspace_id: workspaceId,
      p_stale_after: `${staleAfterHours} hours`,
    });
    if (error) throw error;
    return data as number;
  }

  // ---------------------------------------------------------------------------
  // Publish
  // ---------------------------------------------------------------------------
  static async publishWorkspace(workspaceId: string): Promise<number> {
    const { data, error } = await sb.rpc('exam_recon_publish_workspace', { p_workspace_id: workspaceId });
    if (error) throw error;
    return data as number;
  }

  // ---------------------------------------------------------------------------
  // Realtime subscriptions
  // ---------------------------------------------------------------------------
  static async subscribeToWorkspace(
    workspaceId: string,
    callbacks: {
      onTaskChange?: (payload: any) => void;
      onSlotChange?: (payload: any) => void;
    }
  ): Promise<() => void> {
    const channels: any[] = [];

    // Tasks: filterable by workspace_id
    const tasksChannel = supabase
      .channel(`recon-workspace-tasks-${workspaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exam_recon_assignment_tasks', filter: `workspace_id=eq.${workspaceId}` },
        (payload) => callbacks.onTaskChange?.(payload)
      )
      .subscribe();
    channels.push(tasksChannel);

    // Slots: need to subscribe per-variant (slot table doesn't have workspace_id)
    const variants = await this.listVariants(workspaceId);
    const slotChannel = supabase.channel(`recon-workspace-slots-${workspaceId}`);
    for (const v of variants) {
      slotChannel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exam_recon_variant_slots', filter: `variant_id=eq.${v.id}` },
        (payload) => callbacks.onSlotChange?.(payload)
      );
    }
    slotChannel.subscribe();
    channels.push(slotChannel);

    return () => channels.forEach((ch) => supabase.removeChannel(ch));
  }

  static subscribeToCanonicalQuestion(
    canonicalId: string,
    callbacks: {
      onDraftChange?: (payload: any) => void;
      onCommentChange?: (payload: any) => void;
      onVoteChange?: (payload: any) => void;
      onPresenceChange?: (payload: any) => void;
    }
  ): () => void {
    const channel = supabase
      .channel(`recon-question-${canonicalId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exam_recon_question_drafts', filter: `canonical_question_id=eq.${canonicalId}` },
        (payload) => callbacks.onDraftChange?.(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exam_recon_comments', filter: `canonical_question_id=eq.${canonicalId}` },
        (payload) => callbacks.onCommentChange?.(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exam_recon_votes', filter: `canonical_question_id=eq.${canonicalId}` },
        (payload) => callbacks.onVoteChange?.(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exam_recon_presence', filter: `canonical_question_id=eq.${canonicalId}` },
        (payload) => callbacks.onPresenceChange?.(payload)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }
}

