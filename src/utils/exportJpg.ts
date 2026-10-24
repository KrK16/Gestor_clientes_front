import html2canvas from "html2canvas";

export const buildStaticClone = (node: HTMLElement): HTMLElement => {
  const clone = node.cloneNode(true) as HTMLElement;

  clone.querySelectorAll("textarea, input").forEach((el) => {
    const field = el as HTMLInputElement | HTMLTextAreaElement;
    const div = document.createElement("div");
    let text = field.value;

    if (
      field instanceof HTMLInputElement &&
      field.type === "date" &&
      field.value
    ) {
      const [y, m, d] = field.value.split("-");

      text = `${d}/${m}/${y}`;
    }
    div.textContent = text || " ";
    div.className = field.className;
    const cs = window.getComputedStyle(field);

    div.style.cssText = `font:${cs.font};text-align:${cs.textAlign};padding:${cs.padding};border-bottom:${cs.borderBottom};min-height:${field.offsetHeight}px;overflow-wrap:anywhere;word-break:break-word;white-space:pre-wrap;`;
    el.replaceWith(div);
  });

  return clone;
};

export const downloadJpgFromElement = async (
  element: HTMLElement,
  filename: string,
): Promise<void> => {
  const clone = buildStaticClone(element);

  clone.style.position = "fixed";
  clone.style.left = "-10000px";
  clone.style.top = "0";
  clone.style.width = `${Math.max(element.offsetWidth, element.scrollWidth, 794)}px`;
  document.body.appendChild(clone);
  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const link = document.createElement("a");

    link.href = imgData;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    document.body.removeChild(clone);
  }
};
