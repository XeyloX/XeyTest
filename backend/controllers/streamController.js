import { asyncHandler } from '../middleware/asyncHandler.js';
import { createStream, endStream, getLiveStreamById, listLiveStreams } from '../models/streamModel.js';

export const startStream = asyncHandler(async (req, res) => {
  const { title, category } = req.body;
  const stream = await createStream({ streamerId: req.user.sub, title, category });
  req.app.locals.streamHub.onStreamStarted(stream);
  res.status(201).json({ stream });
});

export const stopStream = asyncHandler(async (req, res) => {
  const stream = await endStream(Number(req.params.streamId), req.user.sub);
  if (!stream) return res.status(404).json({ error: 'Stream not found or already ended' });
  req.app.locals.streamHub.onStreamStopped(stream.id);
  res.json({ stream });
});

export const getLive = asyncHandler(async (req, res) => {
  const stream = await getLiveStreamById(Number(req.params.streamId));
  if (!stream) return res.status(404).json({ error: 'Live stream not found' });
  res.json({ stream });
});

export const listLive = asyncHandler(async (req, res) => {
  const { category, sort, page = 1, pageSize = 20 } = req.query;
  const streams = await listLiveStreams({ category, sort, page: Number(page), pageSize: Math.min(Number(pageSize), 50) });
  res.json({ streams });
});
