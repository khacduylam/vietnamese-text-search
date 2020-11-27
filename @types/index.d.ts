declare namespace TextSearch {
  type TextId = string;
  type TextIndex = object;
  type Text = string;
  type Keyword = string;
  type Score = number;
  type ScoreEntry = [TextId, Score];

  interface TextObject {
    textId: TextId;
    text: Text;
  }

  interface ScoreObject {
    textId: Score;
  }

  interface Text4levelsObject {
    l0: Set<TextId>;
    l1: Set<TextId>;
    l2: Set<TextId>;
    l3: Set<TextId>;
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
      options: TextSearch.SearchOptions,
      cb?: Function
    ): Promise<TextSearch>;

    /** Search for text from instance's text dicionary. */
    public search(
      text: TextSearch.Text,
      options?: TextSearch.SearchOptions,
      cb?: Function
    ): Promise<TextSearch.SearchResult>;

    /** Add a new text object to instance's text dictionary. */
    public addNewTextObj(
      textObj: TextSearch.TextObject,
      cb?: Function
    ): Promise<{ keywords: TextSearch.Keyword[] }>;

    /** Update a text object of instance's text dictionary. */
    public updateTextObj(
      textId: TextSearch.TextId,
      textObj: TextSearch.TextObject,
      cb?: Function
    ): Promise<{ newKeywords: TextSearch.Keyword[]; removedKeywords: TextSearch.Keyword[] }>;

    /** Remove a text object from instance's text dictionary. */
    public removeTextObj(
      textId: TextSearch.TextId,
      cb?: Function
    ): Promise<{ removedKeywords: TextSearch.Keyword[] }>;
  }
  export = TextSearch;
}
