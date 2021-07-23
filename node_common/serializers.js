export const user = (entity) => {
  return {
    type: "USER",
    id: entity.id,
    username: entity.username,
    slates: entity.slates ? entity.slates : [],
    data: {
      name: entity.data.name ? entity.data.name : "",
      photo: entity.data.photo ? entity.data.photo : "",
      body: entity.data.body ? entity.data.body : "",
    },
  };
};

export const slate = (entity) => {
  return {
    type: "SLATE",
    id: entity.id,
    slatename: entity.slatename,
    data: {
      ownerId: entity.data.ownerId,
      name: entity.data.name ? entity.data.name : "",
      body: entity.data.body ? entity.data.body : "",
      objects: entity.data.objects,
      layouts: entity.data.layouts,
    },
  };
};

export class App {
  constructor(name, title, contents) {
    this.name = name;
    this.title = title;
    this.contents = contents;
  }
}

export class DealInfo {
  constructor(cid, minerId, dealGiB, dealPeriod) {
    this.cid = cid;
    this.minerId = minerId;
    this.dealGiB = dealGiB;
    this.dealPeriod = dealPeriod;
  }
}

export class RetrieveInfo {
  constructor(cid, minerId) {
    this.cid = cid;
    this.minerId = minerId;
  }
}

export class indexApp {
  constructor(author, description, keyword, title, slide) {
    this.author = author;
    this.description = description;
    this.keyword = keyword;
    this.title = title;
    this.slide = slide;
  }
}