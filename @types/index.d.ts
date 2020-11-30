declare namespace TextSearch {
  type TextKey = string;
  type TextIndex = object;
  type TextValue = string;
  type Keyword = string;
  type Score = number;
  type ScoreEntry = [TextId, Score];

  interface TextObject {
    textKey: TextKey;
    text: TextValue;
  }

  interface ScoreObject {
    textKey: Score;
  }

  interface Text4levelsObject {
    l0: Set<TextId>;
    l1: Set<TextId>;
    l2: Set<TextId>;
    l3: Set<TextId>;
  }

  interface InitOptions {
    textKeyName: string;
    textValueName: string;
    thresholdScore: Score;
    offset: number;
    limit: number;
    sortOrder: -1 | 1;
  }

  interface SearchOptions {
    thresholdScore: Score;
    offset: number;
    limit: number;
    sortOrder: -1 | 1;
  }

  interface SearchResult {
    data: ScoreEntry[];
    thresholdScore: Score;
    offset: number;
    limit: number;
    sortOrder: -1 | 1;
    total: number;
    text: Text;
  }
}

declare module 'vietnamese-text-search' {
  class TextSearch {
    public constructor();

    /** Initilize an instance of class `TextSearch` and fetch text objects to its text dictionary with default search options. */
    public static init(
      textObjs: TextSearch.TextObject[],
      options: TextSearch.InitOptions,
      cb?: Function
    ): Promise<TextSearch>;

    /** Search for text from instance's text dicionary. */
    public search(
      text: TextSearch.Text,
      options?: TextSearch.SearchOptions,
      cb?: Function
    ): Promise<TextSearch.SearchResult>;

    /**
     * Add a new text object to instance's text dictionary.
     * @deprecated use addTextObj instead.
     */
    public addNewTextObj(
      textObj: TextSearch.TextObject,
      cb?: Function
    ): Promise<{ nUpserted: number; keywords: TextSearch.Keyword[] }>;

    /**
     * Add many new text objects to instance's text dictionary.
     * @deprecated use addManyTextObjs instead.
     */
    public addManyNewTextObjs(
      textObjs: TextSearch.TextObject[],
      cb?: Function
    ): Promise<{ nUpserted: number }>;

    /** Add a new text object to instance's text dictionary. */
    public addTextObj(
      textObj: TextSearch.TextObject,
      cb?: Function
    ): Promise<{ nUpserted: number; keywords: TextSearch.Keyword[] }>;

    /** Add many text objects to instance's text dictionary. */
    public addManyTextObjs(
      textObjs: TextSearch.TextObject[],
      cb?: Function
    ): Promise<{ nUpserted: number }>;

    /** Update a text object of instance's text dictionary. */
    public updateTextObj(
      textKey: TextSearch.TextKey,
      textObj: TextSearch.TextObject,
      cb?: Function
    ): Promise<{
      nUpserted: number;
      newKeywords: TextSearch.Keyword[];
      removedKeywords: TextSearch.Keyword[];
    }>;

    /** Remove a text object from instance's text dictionary. */
    public removeTextObj(
      textKey: TextSearch.TextKey,
      cb?: Function
    ): Promise<{ nRemoved: number; removedKeywords: TextSearch.Keyword[] }>;

    /** Remove many text objects from instance's text dictionary. */
    public removeManyTextObjs(
      textKeys: TextSearch.TextKey[],
      cb?: Function
    ): Promise<{ nRemoved: number }>;
  }
  export = TextSearch;
}
