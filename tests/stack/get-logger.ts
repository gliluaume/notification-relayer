export interface ILogStyles {
  head?: string;
  highlight?: string;
  error?: string;
}

const defaultStyles: ILogStyles = {
  head: "color: bisque",
  highlight: "color: magenta",
  error: "color: orange; font-weight: bold",
};

export interface ILogger {
  info: (text: string, highlight?: string) => void;
  error: (text: string, data?: any) => void;
  data: (text: string, data?: any) => void;
}

export const getLogger = (
  icon: string,
  name: string,
  style: ILogStyles,
): ILogger => {
  const currentStyle = {
    ...defaultStyles,
    ...style,
  } as ILogStyles;

  return {
    info: (text: string, highlight = "") => {
      console.log(
        `%c${icon} ${name} %c${text} %c${highlight}`,
        currentStyle.head,
        "color: white",
        currentStyle.highlight,
      );
    },
    error: (text: string) => {
      console.log(
        `%c${icon} ${name} %c${text}`,
        currentStyle.head,
        currentStyle.error,
      );
    },
    data: (text: string, data?: any) => {
      console.log(
        `%c${icon} ${name} %c${text}`,
        currentStyle.head,
        "color: white",
        data || "",
      );
    },
  };
};