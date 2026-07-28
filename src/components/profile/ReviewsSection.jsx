import { useState, useEffect, useMemo } from "react";
import { Rating } from "@/api/entities";
import { Star, Clock } from "lucide-react";
import { useLanguage, translateText } from "@/lib/LanguageContext";
import { t } from "@/components/utils/translations";

function QualityBadge({ quality, lang }) {
  const [label, setLabel] = useState(quality);
  useEffect(() => {
    if (lang && lang !== "PT") {
      translateText(quality, lang).then(setLabel).catch(() => setLabel(quality));
    } else {
      setLabel(quality);
    }
  }, [lang, quality]);
  return <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{label}</span>;
}

export default function ReviewsSection({ userId }) {
  const { lang } = useLanguage();
  const [ratings, setRatings] = useState([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // #27 — uma avaliação só é pública depois de ambas as partes submeterem.
      // O flag `visible` é activado pela função submit_job_rating no servidor.
      const all = await Rating.filter({ rated_id: userId });
      setRatings(all.filter(r => r.visible !== false));
      setPending(all.filter(r => r.visible === false).length);
      setLoading(false);
    };
    if (userId) load();
  }, [userId]);

  // #78 — média calculada a partir das reviews reais, não do campo users.rating
  // que pode estar desactualizado. Usa score (novo) ou rating (legado).
  const avgRating = useMemo(() => {
    if (!ratings.length) return null;
    const sum = ratings.reduce((acc, r) => acc + Number(r.score ?? r.rating ?? 0), 0);
    return (sum / ratings.length).toFixed(1);
  }, [ratings]);

  if (loading) return <div className="text-sm text-gray-400 py-4 text-center">{t(lang,"loading")}</div>;

  if (ratings.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800 text-sm">{t(lang,"awaitingReview","Sem avaliações ainda")}</p>
          <p className="text-xs text-amber-600 mt-0.5">{t(lang,"awaitingReviewDesc","As avaliações aparecem aqui após a conclusão de obras.")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {/* #78 — sumário de rating com média real calculada das reviews */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="text-center">
          <div className="text-3xl font-black text-yellow-500">{avgRating}</div>
          <div className="flex justify-center mt-1">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={"w-3.5 h-3.5 " + (i <= Math.round(Number(avgRating)) ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-1">{ratings.length} {ratings.length === 1 ? "avaliação" : "avaliações"}</div>
        </div>
        <div className="flex-1">
          {[5,4,3,2,1].map(star => {
            const count = ratings.filter(r => Math.round(Number(r.score ?? r.rating ?? 0)) === star).length;
            const pct = ratings.length ? Math.round((count / ratings.length) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-gray-400 w-3 text-right">{star}</span>
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-yellow-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-6">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            {pending} avaliação(ões) por publicar — ficam visíveis quando ambas as partes avaliarem.
          </p>
        </div>
      )}

      {ratings.map((r) => (
        <RatingCard key={r.id} rating={r} lang={lang} />
      ))}
    </div>
  );
}

function RatingCard({ rating: r, lang }) {
  const [comment, setComment] = useState(r.comment || "");
  useEffect(() => {
    if (r.comment && lang && lang !== "PT") {
      translateText(r.comment, lang).then(setComment).catch(() => setComment(r.comment));
    } else {
      setComment(r.comment || "");
    }
  }, [lang, r.comment]);
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <div className="flex text-yellow-400">
          {[1,2,3,4,5].map(i => (
            <Star key={i} className={"w-4 h-4 " + (i <= (r.score ?? r.rating) ? "fill-yellow-400" : "text-gray-200")} />
          ))}
        </div>
        <span className="text-xs text-gray-400">{new Date(r.created_at || r.created_date).toLocaleDateString()}</span>
      </div>
      {r.comment && <p className="text-sm text-gray-700">{comment}</p>}
      {r.qualities?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {r.qualities.map(q => (
            <QualityBadge key={q} quality={q} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
