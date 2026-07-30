const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { BATCH_SIZE, BATCH_INTERVAL_MINUTES } = require('../config/limits');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'campaigns');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function campaignFilePath(id) {
  return path.join(DATA_DIR, `${id}.json`);
}

function attachmentsDir(campaignId) {
  return path.join(DATA_DIR, campaignId, 'attachments');
}

// Writes attachment buffers to disk and returns metadata only (filename, contentType,
// path) for storing in the campaign JSON - keeps campaign files small and lets
// attachments survive a server restart. The on-disk filename is a generated id, not the
// user-supplied original filename, to avoid path traversal; the original name is kept in
// metadata for display and for the "filename" sent to Resend.
function persistAttachments(campaignId, attachments) {
  if (!attachments || attachments.length === 0) return [];

  const dir = attachmentsDir(campaignId);
  fs.mkdirSync(dir, { recursive: true });

  return attachments.map((attachment, index) => {
    const storedName = `${index}-${crypto.randomUUID()}`;
    fs.writeFileSync(path.join(dir, storedName), attachment.content);

    return {
      filename: attachment.filename,
      contentType: attachment.contentType,
      // Stored relative to DATA_DIR, with forward slashes regardless of OS, so campaign
      // files stay portable across platforms (e.g. written on Windows, read on Linux).
      path: `${campaignId}/attachments/${storedName}`,
    };
  });
}

// Reads a campaign's persisted attachments back into the { filename, content, contentType }
// shape expected by mailer.service.js/resend.service.js.
function readCampaignAttachments(campaign) {
  return (campaign.attachments || []).map((attachment) => ({
    filename: attachment.filename,
    contentType: attachment.contentType,
    content: fs.readFileSync(path.join(DATA_DIR, ...attachment.path.split('/'))),
  }));
}

function chunk(list, size) {
  const chunks = [];
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size));
  }
  return chunks;
}

function buildBatches(recipients, batchSize, intervalMinutes, startTimeMs) {
  return chunk(recipients, batchSize).map((batchRecipients, index) => ({
    index,
    recipients: batchRecipients,
    status: 'pending',
    scheduledAt: new Date(startTimeMs + index * intervalMinutes * 60 * 1000).toISOString(),
    startedAt: null,
    completedAt: null,
    results: [],
  }));
}

// type: 'bulk' (same content to everyone) | 'personalized' (per-recipient placeholders) -
// tells the scheduler whether to run each recipient's subject/text/html through personalize().
function createCampaign({
  type,
  recipients,
  subject,
  text,
  html,
  attachments = [],
  batchSize = BATCH_SIZE,
  intervalMinutes = BATCH_INTERVAL_MINUTES,
}) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const batches = buildBatches(recipients, batchSize, intervalMinutes, now);
  const persistedAttachments = persistAttachments(id, attachments);

  const campaign = {
    id,
    type,
    status: batches.length > 0 ? 'pending' : 'completed',
    subject,
    text: text || '',
    html: html || '',
    attachments: persistedAttachments,
    batchSize,
    intervalMinutes,
    totalRecipients: recipients.length,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    batches,
  };

  saveCampaign(campaign);
  return campaign;
}

// Writes via a temp file + rename so a crash mid-write can never leave a truncated/corrupt
// campaign file on disk - a reader always sees either the previous complete version or the
// new complete version. This is what makes the scheduler's "persist immediately" steps safe.
function saveCampaign(campaign) {
  ensureDataDir();
  campaign.updatedAt = new Date().toISOString();
  const finalPath = campaignFilePath(campaign.id);
  const tempPath = `${finalPath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(campaign, null, 2), 'utf-8');
  fs.renameSync(tempPath, finalPath);
  return campaign;
}

const CANCELLABLE_STATUSES = ['pending', 'in_progress'];

function isCancellable(campaign) {
  return CANCELLABLE_STATUSES.includes(campaign.status);
}

function cancelCampaign(campaign) {
  campaign.status = 'cancelled';
  campaign.cancelledAt = new Date().toISOString();
  saveCampaign(campaign);
  return campaign;
}

function getCampaign(id) {
  ensureDataDir();
  const filePath = campaignFilePath(id);
  if (!fs.existsSync(filePath)) return null;

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function listCampaigns() {
  ensureDataDir();
  return fs
    .readdirSync(DATA_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => getCampaign(file.replace(/\.json$/, '')))
    .filter(Boolean);
}

// Derives read-only progress info from a campaign record - used for status polling.
function getCampaignSummary(campaign) {
  let sent = 0;
  let failed = 0;

  for (const batch of campaign.batches) {
    for (const result of batch.results) {
      if (result.status === 'success') sent += 1;
      else failed += 1;
    }
  }

  const batchesCompleted = campaign.batches.filter((b) => b.status === 'completed').length;
  // A cancelled campaign can still have "pending" batches sitting in the array (they were
  // never touched), but their scheduledAt is stale and they will never actually fire.
  const nextBatch = campaign.status === 'cancelled' ? null : campaign.batches.find((b) => b.status === 'pending');

  return {
    id: campaign.id,
    status: campaign.status,
    totalRecipients: campaign.totalRecipients,
    sent,
    failed,
    remaining: campaign.totalRecipients - sent - failed,
    totalBatches: campaign.batches.length,
    batchesCompleted,
    nextBatchAt: nextBatch ? nextBatch.scheduledAt : null,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
  };
}

module.exports = {
  createCampaign,
  saveCampaign,
  getCampaign,
  listCampaigns,
  getCampaignSummary,
  readCampaignAttachments,
  isCancellable,
  cancelCampaign,
};
