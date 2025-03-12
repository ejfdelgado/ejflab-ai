import { Injectable } from '@angular/core';
import { HttpService } from 'ejflab-front-lib';
import { ImageShoot } from 'src/app/views/img2mesh/img2mesh.component';

export interface Img2MeshData {
  status: string;
  image: ImageShoot | Array<ImageShoot>;
}

export interface Img2MeshDataArray {
  status: string;
  images: Array<ImageShoot>;
}

export interface Img2MeshDataQuery {
  offset: number;
  min_offset: number;
  max: number;
  max_date: number;
  min_date: number;
  max_count: number;
}

@Injectable({
  providedIn: 'root',
})
export class Img2MeshService {
  constructor(
    private httpService: HttpService
  ) {

  }

  inferPageId(image: ImageShoot | Array<ImageShoot>) {
    let pageId = null;
    if (image instanceof Array) {
      if (image.length == 0) {
        return null;
      }
      pageId = image[0].pg;
    } else {
      pageId = image.pg;
    }
    return pageId;
  }

  async savePhoto(
    image: ImageShoot | Array<ImageShoot>
  ): Promise<Img2MeshData> {
    const payload = {
      image,
    };
    const pageId = this.inferPageId(image);
    if (pageId == null) {
      return {
        status: 'ok',
        image: [],
      };
    }
    const response = await this.httpService.post<Img2MeshData>(
      `srv/img2mesh/${pageId}/imagesw`,
      payload,
      {
        showIndicator: true,
      }
    );
    if (response == null) {
      throw Error('No se pudo guardar la foto');
    }
    return response;
  }

  async deletePhotos(
    image: ImageShoot | Array<ImageShoot>
  ): Promise<Img2MeshData> {
    const pageId = this.inferPageId(image);
    if (pageId == null) {
      return {
        status: 'ok',
        image: [],
      };
    }
    const payload = {
      image,
    };
    const response = await this.httpService.post<Img2MeshData>(
      `srv/img2mesh/${pageId}/imagesd`,
      payload,
      {
        showIndicator: true,
      }
    );
    if (response == null) {
      throw Error('No se pudieron leer las fotos');
    }
    return response;
  }

  async pagePhotos(
    pageId: string,
    query: Img2MeshDataQuery
  ): Promise<Img2MeshDataArray> {
    const response = await this.httpService.post<Img2MeshDataArray>(
      `srv/img2mesh/${pageId}/imagesr`,
      query,
      {
        showIndicator: true,
      }
    );
    if (response == null) {
      throw Error('No se pudieron leer las fotos');
    }
    return response;
  }
}
