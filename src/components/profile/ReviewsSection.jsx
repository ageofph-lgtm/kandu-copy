import React, { useState, useEffect } from "react";
import { Rating } from "@/entities/Rating";
import { Star, Clock } from "lucide-react";

export default function ReviewsSection({ userId }) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      // Busca todas as ratings para este utilizador
      const all = await Rating.filter({ rated_id: userId });
      // Aplica a regra de visibilidade: mostra se is_visible=true OU se o prazo já passou
      const visible = all.filter(r => r.is_visible || (r.visible_after && new Date(r.visible_after) <= now));
      setRatings(visible);
      setLoading(false);
    };
    if (userId) load();
  }, [userId]);

  if (loading) return <div className="text-sm text-gray-400 py-4 text-center">A carregar avaliações...</div>;

  if (ratings.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800 text-sm">A aguardar avaliação</p>
          <p className="text-xs text-amber-600 mt-0.5">
            As avaliações são reveladas apenas quando ambas as partes submetem a sua opinião, ou após 7 dias — para garantir imparcialidade.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ratings.map((r) => (
        <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <div className="flex text-yellow-400">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-4 h-4 ${i <= r.rating ? 'fill-yellow-400' : 'text-gray-200'}`} />
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {new Date(r.created_date).toLocaleDateString("pt-PT")}
            </span>
          </div>
          {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
          {r.qualities?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {r.qualities.map(q => (
                <span key={q} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{q}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}