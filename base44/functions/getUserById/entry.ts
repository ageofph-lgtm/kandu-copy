import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Requer sessão válida — não expor dados de utilizadores a pedidos anónimos.
    const authedUser = await base44.auth.me();
    if (!authedUser?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = base44.asServiceRole;

    const { userId } = await req.json();
    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

    const users = await db.entities.User.filter({ id: userId });
    const user = users[0] || null;

    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    // Devolver apenas campos públicos — nunca email a não ser que seja o próprio.
    const isOwnProfile = authedUser.id === userId;

    return Response.json({
      id: user.id,
      full_name: user.full_name,
      email: isOwnProfile ? user.email : undefined,
      user_type: user.user_type,
      rating: user.rating,
      xp: user.xp,
      xp_level: user.xp_level,
      profile_picture_url: user.profile_picture_url,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
