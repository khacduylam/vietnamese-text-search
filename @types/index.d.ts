declare namespace TextSearch {
  type TextKey = string;
  type TextIndex = object;
  type TextValue = string;
  type AddedScore = number;
  type Keyword = string;
  type Score = number;
  type ScoreEntry = [TextId, Score];
  type SortOrder = -1 | 1;

  interface TextObject {
    [textKeyName: string]: TextKey;
    [textValueName: string]: TextValue;
    addedScore?: AddedScore = 0;
  }

  interface ScoreObject {
    [textKeyName: string]: Score;
  }

  interface Text4levelsObject {
    l0: Set<TextKey>;
    l1: Set<TextKey>;
    l2: Set<TextKey>;
    l3: Set<TextKey>;
  }

  interface InitOptions {
    textKeyName?: string = 'textId';
    textValueName?: string = 'text';
    thresholdScore?: Score = 0.5;
    offset?: number = 0;
    limit?: number = 30;
    sortOrder?: SortOrder = -1;
    useAddedScore?: boolean = false;
    autoGenBucket?: boolean = true;
  }

  interface SearchOptions {
    thresholdScore?: Score = 0.5;
    offset?: number = 0;
    limit?: number = 30;
    sortOrder?: SortOrder = -1;
    buckets?: string[];
    useAddedScore?: boolean = false;
  }

  interface AddOptions {
    bucket?: string;
  }

  interface UpdateOptions {
    bucket?: string;
    upsert?: boolean;
  }

  interface RemoveOptions {
    bucket?: string;
    forceRemove?: boolean;
  }

  interface AddDetail {
    nAdded: number;
    nIndices: number;
  }

  interface AddDetails {
    [bucket: string]: AddDetail;
  }

  interface UpdateDetail {
    nUpdated: number;
    nAdded: number;
  }

  interface UpdateDetails {
    [bucket: string]: UpdateDetail;
  }

  interface RemoveDetail {
    nRemoved: number;
  }

  interface RemoveDetails {
    [bucket: string]: RemoveDetail;
  }

  interface SearchResult {
    data: ScoreEntry[];
    thresholdScore: Score;
    offset: number;
    limit: number;
    sortOrder: -1 | 1;
    total: number;
    buckets: string[];
    text: Text;
  }
}

declare module 'vietnamese-text-search' {
  class TextSearch {
    public constructor();

    /** Initilize an instance of class `TextSearch` and fetch text objects to buckets with options. */
    public static init(
      textObjs: TextSearch.TextObject[],
      options?: TextSearch.InitOptions,
      cb?: Function
    ): Promise<TextSearch>;

    /** Search for text from instance's text buckets. */
    public search(
      text: TextSearch.Text,
      options?: TextSearch.SearchOptions,
      cb?: Function
    ): Promise<TextSearch.SearchResult>;

    /**
     * Add a text object.
     * @deprecated use addTextObj instead.
     */
    public addNewTextObj(
      textObj: TextSearch.TextObject,
      options?: TextSearch.AddOptions,
      cb?: Function
    ): Promise<{ nAdded: number; bucket: string; keywords: TextSearch.Keyword[] }>;

    /**
     * Add many text objects.
     * @deprecated use addManyTextObjs instead.
     */
    public addManyNewTextObjs(
      textObjs: TextSearch.TextObject[],
      options?: TextSearch.AddOptions,
      cb?: Function
    ): Promise<{ nAdded: number; details: TextSearch.AddDetails }>;

    /** Add a text object. */
    public addTextObj(
      textObj: TextSearch.TextObject,
      options?: TextSearch.AddOptions,
      cb?: Function
    ): Promise<{ nAdded: number; bucket: string; keywords: TextSearch.Keyword[] }>;

    /** Add many text objects. */
    public addManyTextObjs(
      textObjs: TextSearch.TextObject[],
      options?: TextSearch.AddOptions,
      cb?: Function
    ): Promise<{ nAdded: number; details: TextSearch.AddDetails }>;

    /** Update a text object. */
    public updateTextObj(
      textKey: TextSearch.TextKey,
      textObj: TextSearch.TextObject,
      options?: TextSearch.UpdateOptions,
      cb?: Function
    ): Promise<{
      nUpserted: number;
      bucket: string;
      newKeywords: TextSearch.Keyword[];
      removedKeywords: TextSearch.Keyword[];
    }>;

    /** Update many text objects. */
    public updateManyTextObjs(
      textObjs: TextSearch.TextObject[],
      options?: TextSearch.UpdateOptions,
      cb?: Function
    ): Promise<{ nUpserted: number; details: TextSearch.UpdateDetails }>;

    /** Remove a text object. */
    public removeTextObj(
      textKey: TextSearch.TextKey,
      options?: TextSearch.RemoveOptions,
      cb?: Function
    ): Promise<{ nRemoved: number; bucket: string; removedKeywords: TextSearch.Keyword[] }>;

    /** Remove many text objects. */
    public removeManyTextObjs(
      textKeys: TextSearch.TextKey[],
      options?: TextSearch.RemoveOptions,
      cb?: Function
    ): Promise<{ nRemoved: number; details: TextSearch.RemoveDetails }>;

    /** Remove many text objects. */
    public removeBuckets(buckets: string[] | string): { nRemoved: number; nRemains: number };

    /** Get stats of TextSearch's instance. */
    public getStats(): { nObjects: number; nIndices: number; details: [] };
  }
  export = TextSearch;
}
