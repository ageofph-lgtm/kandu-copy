import { createClient } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClient({ appId: Deno.env.get('APP_ID') || '' });
    const db = base44.asServiceRole;

    const { userId } = await req.json();
    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

    const users = await db.entities.User.filter({ id: userId });
    const user = users[0] || null;

    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    return Response.json({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      user_type: user.user_type,
      rating: user.rating,
      xp: user.xp,
      xp_level: user.xp_level,
      profile_picture_url: user.profile_picture_url
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
