import { Router } from 'express';

export interface IRoute {
    router: Router;
}

export interface IConfig {
    appname: string;
    environment: string;
    port: number;
    url: string;
}

interface Asset {
    left: number;
    top: number;
    width: number;
    height: number;
}

export interface IAsset {
    [key: string]: Asset;
}

export type AssetType = 'opening' | 'mostRecentGIFs' | 'topEmojis' | 'moneyCount' | 'topGames' | 'topStickers' | 'mostUsedWords' | 'summary' | 'ending' | 'noSticker';