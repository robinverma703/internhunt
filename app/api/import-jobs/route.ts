import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, company, description, stipend, link, category, location } = body;

    if (!title || !link) {
      return NextResponse.json({ error: 'Title and link are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert([
        {
          title: title || 'Job Opening',
          company: company || 'Startup',
          description: description || '',
          stipend: stipend || null,
          link: link,
          category: category || 'General',
          location: location || 'Remote'
        }
      ]);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Job imported successfully!', data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}