import { useState, useEffect } from "react";
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

// Uma avaliação só fica pública quando ambas as partes avaliarem — ou
// passados 7 dias, para não ficar escondida se a outra parte nunca avaliar.
const DISCLOSURE_DAYS = 7;
const DISCLOSURE_MS = DISCLOSURE_DAYS * 24 * 60 * 60 * 1000;

export default function ReviewsSection({ userId }) {
  const { lang } = useLanguage();
  const [ratings, setRatings] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [received, given] = await Promise.all([
        Rating.filter({ rated_id: userId }),
        Rating.filter({ rater_id: userId }),
      ]);

      // Avaliações que este utilizador já submeteu, por obra + avaliado
      const givenKeys = new Set(given.map(r => `${r.job_id}:${r.rated_id}`));

      const isDisclosed = (r) => {
        if (givenKeys.has(`${r.job_id}:${r.rater_id}`)) return true;  // ambos avaliaram
        const createdAt = new Date(r.created_at || r.created_date).getTime();
        return Number.isFinite(createdAt) && Date.now() - createdAt > DISCLOSURE_MS;
      };

      const visible = received.filter(isDisclosed);
      setRatings(visible);
      setPendingCount(received.length - visible.length);
      setLoading(false);
    };
    if (userId) load();
  }, [userId]);

  if (loading) return <div className="text-sm text-gray-400 py-4 text-center">{t(lang,"loading")}</div>;

  if (ratings.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800 text-sm">{t(lang,"awaitingReview")}</p>
          <p className="text-xs text-amber-600 mt-0.5">{t(lang,"awaitingReviewDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">
            {t(lang, "hiddenReviewsNotice", "{n} avaliação(ões) por revelar — ficam visíveis quando ambas as partes avaliarem.")
              .replace("{n}", pendingCount)}
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
        <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
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
