type SpacerProps = {
  height?: number;
  className?: string;
};

export function Spacer({ height = 24, className = "" }: SpacerProps) {
  return <div className={className} style={{ height: `${height}px` }} />;
}
