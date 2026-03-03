interface BookingKitConfig {
  calendarSlug: string;
  baseUrl?: string;
}

function init(el: HTMLElement): void {
  const slug = el.dataset.bookingKit;
  const baseUrl = el.dataset.bookingKitUrl ?? "";

  if (!slug) {
    console.warn("[BookingKit] Missing data-booking-kit attribute");
    return;
  }

  const config: BookingKitConfig = {
    calendarSlug: slug,
    baseUrl,
  };

  el.innerHTML = `<iframe
    src="${config.baseUrl}/${config.calendarSlug}"
    style="width:100%;height:600px;border:none;border-radius:8px;"
    title="Book a time"
    loading="lazy"
  ></iframe>`;
}

function bootstrap(): void {
  const elements = document.querySelectorAll<HTMLElement>("[data-booking-kit]");
  elements.forEach(init);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
}

export { init, bootstrap };
export type { BookingKitConfig };
