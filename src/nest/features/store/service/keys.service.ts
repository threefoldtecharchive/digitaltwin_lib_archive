import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'redis-om';

import { DbService } from '../../db/service/db.service';
import { EncryptionService } from '../../encryption/service/encryption.service';
import { Key, keySchema, KeyType } from '../models/key.model';

@Injectable()
export class KeyService {
    private keyRepo: Repository<Key>;

    constructor(
        private readonly _configService: ConfigService,
        private readonly _dbService: DbService,
        private readonly _encryptionService: EncryptionService
    ) {
        this.keyRepo = _dbService.createRepository(keySchema);
    }

    /**
     * Updates either private or public key based on the key type.
     * @param {Uint8Array} pk - Private/Public key in Uint8Array format.
     * @param {KeyType} keyType - Identifies a key as public or private.
     */
    async updateKey(pk: Uint8Array, keyType: KeyType) {
        const pkString = this._encryptionService.uint8ToBase64(pk);
        try {
            await this._dbService.createIndex(this.keyRepo);
            const userId = this._configService.get<string>('userId');
            const pkEntity = this.keyRepo.createEntity({ userId, key: pkString, keyType });
            return await this.keyRepo.save(pkEntity);
        } catch (error) {
            throw new BadRequestException(error);
        }
    }
}
