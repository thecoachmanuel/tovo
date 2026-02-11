import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL as string;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD as string;

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing supabase env' }, { status: 500 });
  }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Missing admin env' }, { status: 400 });
  }

  const admin = createSupabaseAdmin(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const list = await admin.auth.admin.listUsers();
  if ('error' in list && list.error) {
    return NextResponse.json({ error: list.error.message }, { status: 500 });
  }

  const exists = list.data.users.find((u) => u.email === ADMIN_EMAIL);
  if (exists) {
    const upd = await admin.auth.admin.updateUserById(exists.id, {
      user_metadata: { role: 'admin' },
    });
    if ('error' in upd && upd.error) {
      return NextResponse.json({ error: upd.error.message }, { status: 500 });
    }
    return NextResponse.json({ created: false, promoted: true });
  }

  const res = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    user_metadata: { role: 'admin' },
    email_confirm: true,
  });
  if ('error' in res && res.error) {
    return NextResponse.json({ error: res.error.message }, { status: 500 });
  }

  return NextResponse.json({ created: true });
}
