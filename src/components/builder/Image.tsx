import NextImage from "next/image";

type ImageProps = {
  src?: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
};

export function ImageBlock({ src = "", alt = "", className = "", width, height }: ImageProps) {
  if (!src) return <div className={`flex min-h-[120px] items-center justify-center border border-dashed ${className}`}>No image</div>;
  return (
    <div className={className}>
      <NextImage
        src={src}
        alt={alt || "Image"}
        width={width ?? 800}
        height={height ?? 400}
        className="h-auto w-full object-cover"
        unoptimized
      />
    </div>
  );
}
