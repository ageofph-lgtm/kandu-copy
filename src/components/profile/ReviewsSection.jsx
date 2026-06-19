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

export default function ReviewsSection({ userId }) {
  const { lang } = useLanguage();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const all = await Rating.filter({ rated_id: userId });
      const visible = all.filter(r => r.is_visible || (r.visible_after && new Date(r.visible_after) <= now));
      setRatings(visible);
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
                <Star key={i} className={"w-4 h-4 " + (i <= r.rating ? "fill-yellow-400" : "text-gray-200")} />
              ))}
            </div>
            <span className="text-xs text-gray-400">{new Date(r.created_date).toLocaleDateString()}</span>
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
