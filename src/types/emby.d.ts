export interface EmbyItem {
  Id: string;
  Name: string;
  ServerId?: string;
  Type?: string;
  ProductionYear?: number;
  PremiereDate?: string;
  CommunityRating?: number;
  OfficialRating?: string;
  RunTimeTicks?: number;
  Genres?: string[];
  Path?: string;
  ChildCount?: number;
  RecursiveItemCount?: number;
  IndexNumber?: number;
  MediaSources?: Array<{
    Name?: string;
    Container?: string;
    Size?: number;
    Bitrate?: number;
    Path?: string;
    MediaStreams?: Array<{
      Type?: string;
      Language?: string;
      DisplayTitle?: string;
      Codec?: string;
      Width?: number;
      Height?: number;
      BitRate?: number;
      BitDepth?: number;
      Channels?: number;
      IsForced?: boolean;
    }>;
  }>;
  Seasons?: EmbyItem[];
}
