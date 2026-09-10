// Vote submission for course materials, shared by the card, mobile card and
// table views — all three used to carry an identical copy of this request.

/**
 * Casts a vote, or clears it when the arrow already picked is clicked again.
 * Callers apply their own optimistic update from the returned value.
 * @param {{materialId: string, userVote: number|null}} material
 * @param {1|-1} value
 * @returns {Promise<{ok: boolean, value?: number|null, error?: string}>}
 */
export const submitMaterialVote = async (material, value) => {
  const url = `/api/materials/${material.materialId}/vote`;
  const isUndo = material.userVote === value;

  try {
    const res = await fetch(url, isUndo
      ? { method: 'DELETE' }
      : {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });

    if (res.ok) return { ok: true, value: isUndo ? null : value };

    // Surface why it failed — a silent no-op reads as "my vote didn't count"
    const data = await res.json().catch(() => ({}));
    return {
      ok: false,
      error: res.status === 401
        ? 'Sign in to vote'
        : data.error || 'Failed to vote',
    };
  } catch (err) {
    console.error('Vote request failed:', err);
    return { ok: false, error: 'Failed to vote' };
  }
};
