/**
 * Created by weijian on 2016/12/29.
 */
/// <reference types="mongodb" />
import * as mongodb from "mongodb";

declare module Mongorito {
    function connect(url: string): Promise<mongodb.Db>

    class Model {
        constructor(o: any, options?: Object);

        save(options?: any): Promise<any>;

        create(options?: any): Promise<any>;

        update(options?: any): Promise<any>;

        remove(options?: any): Promise<any>;

        static remove(query: Object): Promise<any>;

        static find(query: Object): Promise<any[]>;

        static count(query: Object): Promise<any>;

        static all(): Promise<any[]>

        static findOne(query: Object): Promise<any>;

        static findById(id: string): Promise<any>;

        static drop(): Promise<any>;

    }
}
export=Mongorito
