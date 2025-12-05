/**
 * Platform: According Export WhatsApp Date format
 */
export type Platform = "Android" | "iOS" | null;

/**
 * MessageType: According message pattern
 */
export type MessageType = "text" | "media_omitted" | "file" | "voice" | "video" | "image" | "sticker" | "mixed";

/**
 * Theme Configuration
 */
export interface Theme {
    background_color: string;
    background_image?: string;
    background_image_ext?: string;
    bubble: BubbleConfig;
    fonts: FontsConfig;
    layout: LayoutConfig;
    metadata?: PDFConfig;
    watermark?: WatermarkConfig;
    path?: string;
}

/**
 * Theme's Bubble Config
 */
export interface BubbleConfig {
    color: string;
    color_other: string;
    max_width_percent: number;
    margin_top: number;
    margin_bottom: number;
    padding_left: number;
    padding_right: number;
    padding_top: number;
    padding_bottom: number;
    radius: number;
}

/**
 * Theme's Fonts Config
 */
export interface FontsConfig {
    color: string;
    family: string; // 默认字体名称 (如 Helvetica)
    size: number;
}

/**
 * Theme's Layout Config
 */
export interface LayoutConfig {
    margin_left: number;
    margin_right: number;
    margin_top: number;
    margin_bottom: number;
}

/**
 * Theme's PDF metadata Config
 */
export interface PDFConfig {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    password?: string;
}

/**
 * Theme's Watermark Config
 */
export interface WatermarkConfig {
    size: number;
    style: "Tiled" | "Centered";
    text: string;
}

/**
 * Renderer's Background Config
 */
export interface BackgroundConfig {
    color: string;
    image: string | Buffer;
    ext: string | null;
    height: number;
    width: number;
}

/**
 * Util's detectMessageType return params
 */
export interface MessageContentType {
    type: MessageType;
    text: string;
    filename?: string;
}

/**
 * Renderer's Each Message
 */
export interface Message extends MessageContentType {
    datetime: string;
    sender: string;
    text: string;
    parsedDatetime: Date;
    lineNumber: number;
    inline?: boolean;
}

/**
 * Parser Exported Message
 */
export interface ChatData {
    messages: Message[];
    contacts: string[];
    platform: Platform;
    mediaFiles: Record<string, Buffer>;
    totalMessages: number;
}

/**
 * Renderer's Each Letters Config
 */
export interface linesData {
    char?: string,
    filename?: string;
    x?: number,
    y?: number,
    family?: string,
    height?: number,
    width: number,
    type: MessageType
}

/**
 * Renderer's Each Word Config
 */
export interface lineResult {
    lines: linesData[],
    totalHeight: number,
    totalWidth: number
}

/**
 * WhatsApp2PDF Class Options
 */
export interface WhatsApp2PDFOptions {
    output?: string;
    mainUser?: string;
    privacy?: boolean;
    start?: string;
    end?: string;
    keyword?: string;
    images?: boolean;
    verbose?: boolean;
    theme?: string | Theme;
    themePath?: string | null;
}

/**
 * WhatsApp2PDF Class Parse Result
 */
export interface ConvertResult {
    outputPath: string;
    fileName: string;
    fileSize: number;
    fileSizeFormatted: string;
    messages: number;
    media: number;
    contacts: string[];
    platform: Platform;
    mainUser: string;
    theme: string;
}

/**
 * WhatsApp2PDF Class Options (Cli)
 */
export interface CliOptions {
    listThemes?: boolean;
    output?: string;
    mainUser?: string;
    privacy?: boolean;
    images?: boolean;
    theme?: string;
    themePath?: string;
    start?: string;
    end?: string;
    keyword?: string;
    verbose?: boolean;
}
