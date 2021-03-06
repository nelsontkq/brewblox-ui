interface PanArguments {
  evt: MouseEvent | TouchEvent;
  position: { top: number; left: number };
  direction: 'left' | 'right' | 'up' | 'down';
  duration: number;
  distance: { x: number; y: number };
  offset: { x: number; y: number };
  delta: { x: number; y: number };
  isFirst: boolean;
  isFinal: boolean;
}

interface HoldArguments {
  evt: MouseEvent | TouchEvent;
  position: { top: number; left: number };
  duration: number;
}

interface XYPosition {
  x: number;
  y: number;
}

interface GridSize {
  cols: number;
  rows: number;
}

type InputRule = (val: any) => boolean | string;

interface SelectOption {
  label: string;
  value: any;
}

type Mapped<T> = Record<string, T>;

interface HasId {
  id: string;
}

interface QuasarNode {
  label: string;
  value: any;
  children?: QuasarNode[];

  icon?: string;
  iconColor?: string;
  img?: string;
  avatar?: string;
  disabled?: boolean;
  expandable?: boolean;
  selectable?: boolean;
  handler?: (node: QuasarNode) => void;
  tickable?: boolean;
  noTick?: boolean;
  tickStrategy?: string;
  lazy?: boolean;
  header?: string;
  body?: string;
}
