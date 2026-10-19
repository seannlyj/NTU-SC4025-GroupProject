import { CloseIcon } from './icons';

/** An applied filter, removable with its round × button. */
export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-[42px] items-center gap-2 rounded-full border-[1.5px] border-outline pr-[6px] pl-[16px] text-[14px] text-ink">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="relative grid size-7 place-items-center rounded-full bg-back text-ink before:absolute before:-inset-2 before:content-['']"
      >
        <CloseIcon size={16} strokeWidth={2.2} />
      </button>
    </span>
  );
}
