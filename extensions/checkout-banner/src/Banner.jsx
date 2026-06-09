import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useAppMetafields } from "@shopify/ui-extensions/checkout/preact";

export default () => {
  render(<Extension />, document.body);
};

function Extension() {
  const metafields = useAppMetafields({
    type: "shop",
    namespace: "custom",
    key: "banner_checkout",
  });

  const entry = metafields?.[0];
  const rawValue = entry?.metafield?.value;

  // Si no hay datos, no renderizar nada
  if (!rawValue) {
    return null;
  }

  let data;
  try {
    data = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
  } catch {
    return null;
  }

  const config = Array.isArray(data) ? data[0] : data;
  if (!config) {
    return null;
  }

  const records = config.records ?? [];
  const record = records.find(isRecordVisible);
  const desktopSrc = record?.desktop_image || config.default_desktop_image;
  const mobileSrc =
    record?.mobile_image ||
    record?.desktop_image ||
    config.default_mobile_image ||
    config.default_desktop_image;

  // Si no hay imagen configurada, no renderizar nada
  if (!desktopSrc && !mobileSrc) {
    return null;
  }

  const alt = record?.alt || "Banner";

  // Usar s-query-container para mostrar/ocultar imágenes según el ancho
  const img = (
    <s-query-container>
      {/* Imagen mobile: se muestra cuando inline-size <= 767px */}
      <s-box display="@container (inline-size > 767px) none, block">
        <s-image
          src={mobileSrc}
          alt={alt}
          aspectRatio="5.7/1"
          inlineSize="fill"
          objectFit="contain"
        />
      </s-box>
      {/* Imagen desktop: se muestra cuando inline-size > 767px */}
      <s-box display="@container (inline-size > 767px) block, none">
        <s-image
          src={desktopSrc}
          alt={alt}
          aspectRatio="17/1"
          inlineSize="fill"
          objectFit="contain"
        />
      </s-box>
    </s-query-container>
  );

  if (record?.url) {
    const target = record.link_behavior === "new_page" ? "_blank" : "_self";
    return (
      <s-clickable href={record.url} target={target}>
        {img}
      </s-clickable>
    );
  }

  return img;
}

function isRecordVisible(record) {
  const dateRanges = record.date_ranges;

  if (!dateRanges || dateRanges.length === 0) {
    return true;
  }

  const now = new Date();

  for (const range of dateRanges) {
    const start = new Date(range.start_date);
    const end = new Date(range.end_date);

    // Validar si estamos dentro del rango de fechas
    if (now >= start && now <= end) {
      const timeRanges = range.time_ranges;

      if (timeRanges && timeRanges.length > 0) {
        // Hay rangos de horas, verificar si la hora actual está dentro de alguno
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        for (const timeRange of timeRanges) {
          const [startHour, startMinute] = timeRange.start_time
            .split(":")
            .map(Number);
          const [endHour, endMinute] = timeRange.end_time
            .split(":")
            .map(Number);

          const startTimeInMinutes = startHour * 60 + startMinute;
          const endTimeInMinutes = endHour * 60 + endMinute;

          // Manejar cruce de medianoche (ej. 19:30 a 10:00)
          if (endTimeInMinutes < startTimeInMinutes) {
            if (
              currentTimeInMinutes >= startTimeInMinutes ||
              currentTimeInMinutes <= endTimeInMinutes
            ) {
              return true;
            }
          } else if (
            currentTimeInMinutes >= startTimeInMinutes &&
            currentTimeInMinutes <= endTimeInMinutes
          ) {
            return true;
          }
        }
      } else {
        // No hay rangos de horas, todo el día es válido
        return true;
      }
    }
  }

  return false;
}
