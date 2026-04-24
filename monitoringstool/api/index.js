// Full Vercel API route - all endpoints
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

app.get('/health', async (req, res) => {
  try {
    const { error } = await supabase.from('questions').select('id').limit(1);
    res.json({ status: error ? 'error' : 'OK', database: error ? 'disconnected' : 'connected' });
  } catch (e) {
    res.status(500).json({ status: 'error', database: 'error', error: e.message });
  }
});

app.get('/questions', async (req, res) => {
  try {
    const { data, error } = await supabase.from('questions').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ data: data || [], pagination: { page: 1, limit: 50, total: data?.length || 0 } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/questions', async (req, res) => {
  try {
    const { title, description, category, priority, status, mode } = req.body;
    const { data, error } = await supabase.from('questions').insert({
      uuid: uuidv4(),
      title,
      description: description || null,
      category: category || null,
      priority: priority || 'medium',
      status: status || 'active',
      mode: mode || 'regular',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    res.status(201).json({ message: 'Question created', data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/questions/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const { title, description, category, priority, status, mode } = req.body;
    const { data, error } = await supabase.from('questions').update({
      title, description, category, priority, status, mode,
      updated_at: new Date().toISOString()
    }).eq('uuid', uuid).select().single();
    if (error) throw error;
    res.json({ message: 'Question updated', data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/questions/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const { error } = await supabase.from('questions').delete().eq('uuid', uuid);
    if (error) throw error;
    res.json({ message: 'Question deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/responses/stats', async (req, res) => {
  try {
    const { location } = req.query;
    let query = supabase.from('responses').select('question_uuid, response_data, survey_type');
    const { data, error } = await query;
    if (error) throw error;

    const byQuestion = {};
    for (const row of data || []) {
      const qid = row.question_uuid;
      const value = row.response_data?.value || row.response_data?.label;
      if (!qid || !value) continue;
      if (!byQuestion[qid]) byQuestion[qid] = { question_uuid: qid, total: 0, counts: {} };
      byQuestion[qid].total += 1;
      byQuestion[qid].counts[value] = (byQuestion[qid].counts[value] || 0) + 1;
    }

    const qIds = Object.keys(byQuestion);
    let titles = {};
    if (qIds.length) {
      const { data: qData } = await supabase.from('questions').select('uuid, title').in('uuid', qIds);
      titles = Object.fromEntries((qData || []).map(q => [q.uuid, q.title]));
    }

    const results = Object.values(byQuestion).map(b => ({
      question_uuid: b.question_uuid,
      question_title: titles[b.question_uuid] || b.question_uuid,
      survey_type: 'regular',
      total: b.total,
      counts: b.counts
    }));

    res.json({ data: results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/responses', async (req, res) => {
  try {
    const { responses, survey_type, location } = req.body;
    const submissionUuid = uuidv4();

    const { error: subError } = await supabase.from('submissions').insert({
      uuid: submissionUuid,
      survey_type: survey_type || 'regular',
      location: location || null,
      created_at: new Date().toISOString()
    });
    if (subError) throw subError;

    const records = (responses || []).map(r => ({
      uuid: uuidv4(),
      submission_uuid: submissionUuid,
      question_uuid: r.question_uuid,
      response_data: r.response_data,
      user_identifier: r.user_identifier || null,
      survey_type: survey_type || 'regular'
    }));

    const { error } = await supabase.from('responses').insert(records);
    if (error) throw error;

    res.status(201).json({ message: 'Responses saved', submission_uuid: submissionUuid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/submissions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*, responses(*)')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    res.json({ data: data || [], pagination: { page: 1, limit: 20, total: data?.length || 0 } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Monitoringstool API', version: '1.0' });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

export default app;