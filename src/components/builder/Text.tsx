type TextProps = {
  content?: string;
  className?: string;
};

export function TextBlock({ content = "", className = "" }: TextProps) {
  return <div className={`prose max-w-none ${className}`} dangerouslySetInnerHTML={{ __html: content || "<p></p>" }} />;
}
