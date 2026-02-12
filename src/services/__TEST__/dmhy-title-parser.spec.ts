import { describe, expect, it } from 'vitest';
import { parseDmhyTitle } from '@/adapters/dmhy-title-parser';

describe('parseDmhyTitle', () => {
  describe('LoliHouse format', () => {
    it('[字幕组&字幕组] 中文 / Romaji - EP [WebRip 1080p HEVC-10bit AAC][简繁日内封字幕]', () => {
      const raw = '[三明治摆烂组&LoliHouse] 泛而不精的我被逐出了勇者队伍 / Yuusha Party wo Oidasareta Kiyoubinbou - 06 [WebRip 1080p HEVC-10bit AAC][简繁日内封字幕]';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('三明治摆烂组&LoliHouse');
      expect(p.title).toBe('泛而不精的我被逐出了勇者队伍');
      expect(p.resolution).toBe('1080p');
      expect(p.codec).toContain('HEVC');
      expect(p.audio).toContain('AAC');
      expect(p.source).toBe('WebRip');
      expect(p.subtitle).toContain('简繁日内封字幕');
      expect(p.episode).toBe('06');
    });

    it('[LoliHouse] 中文 / Romaji - EP [WebRip 1080p HEVC-10bit AAC][简繁内封字幕]', () => {
      const raw = '[LoliHouse] 优雅贵族的休假指南。  / Odayaka Kizoku no Kyuuka no Susume. - 06 [WebRip 1080p HEVC-10bit AAC][简繁内封字幕]';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('LoliHouse');
      expect(p.title).toBe('优雅贵族的休假指南。');
      expect(p.resolution).toBe('1080p');
      expect(p.source).toBe('WebRip');
      expect(p.episode).toBe('06');
    });

    it('[百冬练习组&LoliHouse] 中文 / Romaji - EP', () => {
      const raw = '[百冬练习组&LoliHouse] 元祖！邦多利酱 / GANSO BanG Dream Chan - 19 [WebRip 1080p HEVC-10bit AAC][简繁内封字幕]';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('百冬练习组&LoliHouse');
      expect(p.title).toBe('元祖！邦多利酱');
      expect(p.episode).toBe('19');
    });
  });

  describe('百冬練習組 / 幻樱字幕组 format', () => {
    it('【字幕组】【中文_Romaji】[EP][Res Codec Audio][字幕]', () => {
      const raw = '【百冬練習組】【元祖！邦多利醬_GANSO BanG Dream Chan】[19][1080p AVC AAC][繁體]';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('百冬練習組');
      expect(p.title).toContain('邦多利');
      expect(p.resolution).toBe('1080p');
      expect(p.episode).toBe('19');
    });

    it('【幻櫻字幕組】【10月新番】【标题 Romaji】【EP range】【Res Codec Audio】【字幕】', () => {
      const raw = '【幻櫻字幕組】【10月新番】【不擅吸血的吸血鬼 Chanto Suenai Kyuuketsuki-chan】【01-12】【BIG5_MP4】【1920X1080】';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('幻櫻字幕組');
      expect(p.title).toContain('不擅吸血的吸血鬼');
      expect(p.episode).toBe('01-12');
    });
  });

  describe('ANi format', () => {
    it('[ANi] English / 中文 - EP [1080P][Baha][WEB-DL][AAC AVC][CHT][MP4]', () => {
      const raw = '[ANi] Sentenced to Be a Hero /  判處勇者刑 - 06 [1080P][Baha][WEB-DL][AAC AVC][CHT][MP4]';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('ANi');
      expect(p.title).toBe('判處勇者刑');
      expect(p.resolution).toBe('1080P');
      expect(p.source).toBe('Baha');
      expect(p.format).toBe('MP4');
      expect(p.episode).toBe('06');
    });

    it('[ANi] Koala Enikki / 無尾熊繪日記 - 20', () => {
      const raw = '[ANi] Koala Enikki /  無尾熊繪日記 - 20 [1080P][Baha][WEB-DL][AAC AVC][CHT][MP4]';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('ANi');
      expect(p.title).toBe('無尾熊繪日記');
      expect(p.episode).toBe('20');
    });
  });

  describe('桜都字幕组 format', () => {
    it('[桜都字幕组] 标题 第二季 / Romaji S2 [EP][Res][字幕]', () => {
      const raw = '[桜都字幕组] 葬送的芙莉莲 第二季 / Sousou no Frieren S2 [04v2][1080p][繁体内嵌]';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('桜都字幕组');
      expect(p.title).toContain('葬送的芙莉莲');
      expect(p.resolution).toBe('1080p');
      expect(p.episode).toBe('04v2');
      expect(p.season).toContain('第二季');
    });
  });

  describe('绿茶字幕组 format', () => {
    it('[绿茶字幕组] 标题 / Romaji [EP range][WebRip][Res][字幕]', () => {
      const raw = '[绿茶字幕组] 朋友的妹妹只喜欢烦我 / Tomodachi no Imouto ga Ore ni dake Uzai [01-12修正合集][WebRip][1080p][繁简日内封]';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('绿茶字幕组');
      expect(p.title).toBe('朋友的妹妹只喜欢烦我');
      expect(p.resolution).toBe('1080p');
      expect(p.source).toBe('WebRip');
      expect(p.episode).toBe('01-12');
    });

    it('[绿茶字幕组] 间谍过家家 第3期/SPY×FAMILY Season 3', () => {
      const raw = '[绿茶字幕组] 间谍过家家 第3期/SPY×FAMILY Season 3 [38-50 修正合集][WebRip][1080p][简繁日内封]';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('绿茶字幕组');
      expect(p.title).toContain('间谍过家家');
      expect(p.season).toBeDefined();
    });
  });

  describe('SweetSub format', () => {
    it('[SweetSub][标题][Romaji][EP][WebRip][Res][Codec][字幕]', () => {
      const raw = '[SweetSub][靠死亡游戏混饭吃。][Shibou Yuugi de Meshi wo Kuu.][06][WebRip][1080P][AVC 8bit][简日双语]（检索用：以死亡游戏为生。）';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('SweetSub');
      expect(p.title).toContain('靠死亡游戏混饭吃');
      expect(p.resolution).toBe('1080P');
      expect(p.source).toBe('WebRip');
      expect(p.episode).toBe('06');
    });
  });

  describe('VCB-Studio format', () => {
    it('[组1&组2] 中文 / Romaji 10-bit 1080p HEVC BDRip [Fin]', () => {
      const raw = '[SweetSub&VCB-Studio] 小城日常 / CITY THE ANIMATION 10-bit 1080p HEVC BDRip [Fin]';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('SweetSub&VCB-Studio');
      expect(p.title).toBe('小城日常');
      expect(p.resolution).toBe('1080p');
      expect(p.codec).toContain('HEVC');
      expect(p.source).toBe('BDRip');
    });

    it('[VCB-Studio] 中文 / Romaji / 日文 10-bit 1080p AV1 BDRip [Fin]', () => {
      const raw = '[VCB-Studio] 丹特丽安的书架 / Dantalian no Shoka / ダンタリアンの書架 10-bit 1080p AV1 BDRip [Fin]';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('VCB-Studio');
      expect(p.title).toBe('丹特丽安的书架');
      expect(p.resolution).toBe('1080p');
      expect(p.source).toBe('BDRip');
    });
  });

  describe('GMTeam format', () => {
    it('[GM-Team][国漫][中文 第N季][English][Year][EP][Codec][Lang][Res]', () => {
      const raw = '[GM-Team][国漫][武动乾坤 第6季][Martial Universe 6th Season][2025][01-12 Fin][AVC][GB][1080P]';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('GM-Team');
      expect(p.title).toContain('武动乾坤');
      expect(p.resolution).toBe('1080P');
      expect(p.episode).toBe('01-12');
    });

    it('[GM-Team][国漫][标题][English][Year][EP][HEVC][Lang][4K]', () => {
      const raw = '[GM-Team][国漫][傲世丹神][The Alchemist\'s Rise][2025][01-12 Fin][HEVC][GB][4K]';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('GM-Team');
      expect(p.title).toContain('傲世丹神');
      expect(p.codec).toContain('HEVC');
    });
  });

  describe('jibaketa format', () => {
    it('[jibaketa合成&音頻壓制][代理商粵語] 标题 / Romaji - EP [字幕](Source Res Codec Audio 字幕)', () => {
      const raw = '[jibaketa合成&音頻壓制][代理商粵語]時光代理人 / Link Click - 08 [粵日國三語+內封繁體中文字幕](WEB 1920x1080 x264 AACx3 SRTx2+PGS Ani-One CHT)';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('jibaketa合成&音頻壓制');
      expect(p.title).toContain('時光代理人');
      expect(p.episode).toBe('08');
    });

    it('[jibaketa合成&壓制] Dragon Ball Daima', () => {
      const raw = '[jibaketa合成&壓制][Viu粵語]龍珠大魔 / 七龍珠大魔 / Dragon Ball Daima - S1 [粵日雙語+內封繁體中文字幕] (BD 1920x1080 x264 AACx2 SRT Viu CHT)';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('jibaketa合成&壓制');
      expect(p.title).toContain('龍珠大魔');
    });
  });

  describe('六四位元字幕組 star format', () => {
    it('六四位元字幕組★标题★EP★Res★Source Codec Audio Format★字幕', () => {
      const raw = '六四位元字幕組★死靈之子的宇宙恐怖秀 Necronomico no Cosmic Horror Show★01~12_完★1920x1080★BDRIP AVC FLAC MKV★外掛繁體中文';
      const p = parseDmhyTitle(raw);
      expect(p.title).toContain('死靈之子的宇宙恐怖秀');
    });
  });

  describe('整理搬运 collection format', () => {
    it('[整理搬运] 标题 (日文) (罗马字)：描述', () => {
      const raw = '[整理搬运] 星际牛仔 (カウボーイビバップ) (Cowboy Bebop)：TV动画+剧场版+漫画+音乐+其他；日语音轨; 外挂简中字幕 (整理时间：2024.03.05)';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('整理搬运');
      expect(p.title).toBe('星际牛仔');
    });

    it('[整理搬运] 犬夜叉 (Inuyasha)', () => {
      const raw = '[整理搬运] 犬夜叉 (Inuyasha)：TV动画 (本篇、完结篇)+剧场版+OVA篇+漫画+CD+其他；华日, 华日英, 日语音轨; 外挂简中字幕 (整理时间：2023.05.02)';
      const p = parseDmhyTitle(raw);
      expect(p.title).toBe('犬夜叉');
    });

    it('[整理搬运] 新世纪福音战士', () => {
      const raw = '[整理搬运] 新世纪福音战士 (新世紀エヴァンゲリオン) (Neon Genesis Evangelion)：TV动画+老剧场版+新剧场版+ONA篇+CD+漫画+其他；日语音轨; 外挂简中, 英文字幕 (整理时间：2025.10.05)';
      const p = parseDmhyTitle(raw);
      expect(p.title).toBe('新世纪福音战士');
    });

    it('[整理搬运] 凉宫春日', () => {
      const raw = '[整理搬运] 凉宫春日 (涼宮ハルヒ) (Haruhi Suzumiya) 系列：TV动画 (2009年版)+剧场版+ONA篇+小说+漫画+音乐会+CD+其他；日语音轨; 外挂简中字幕 (整理时间：2023.10.15)';
      const p = parseDmhyTitle(raw);
      expect(p.title).toBe('凉宫春日');
    });
  });

  describe('沸班亚马制作组 format', () => {
    it('[沸班亚马制作组] 标题 - EP range [Source Res Codec Audio][字幕]', () => {
      const raw = '[沸班亚马制作组] 泛而不精的我被逐出了勇者队伍 - 04-07 [IQIYI WebRip 2160p HEVC OPUS][简繁内封字幕]';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('沸班亚马制作组');
      expect(p.title).toBe('泛而不精的我被逐出了勇者队伍');
      expect(p.resolution).toBe('2160p');
      expect(p.codec).toContain('HEVC');
      expect(p.audio).toContain('OPUS');
      expect(p.source).toContain('IQIYI');
      expect(p.episode).toBe('04-07');
    });
  });

  describe('29岁单身 / LoliHouse 简体内封', () => {
    it('[LoliHouse] 29岁单身 - 06 [WebRip 1080p HEVC-10bit AAC][简体内封字幕]', () => {
      const raw = '[LoliHouse] 29岁单身中坚冒险家的日常 /  29-sai Dokushin Chuuken Boukensha no Nichijou - 06 [WebRip 1080p HEVC-10bit AAC][简体内封字幕]';
      const p = parseDmhyTitle(raw);
      expect(p.group).toBe('LoliHouse');
      expect(p.title).toContain('29岁单身中坚冒险家的日常');
      expect(p.episode).toBe('06');
    });
  });

  describe('edge cases', () => {
    it('empty string', () => {
      const p = parseDmhyTitle('');
      expect(p.title).toBe('');
      expect(p.group).toBe('');
    });

    it('title with no brackets', () => {
      const p = parseDmhyTitle('葬送的芙莉莲 1080p');
      expect(p.title).toBe('葬送的芙莉莲');
      expect(p.resolution).toBe('1080p');
    });

    it('handles zero-width characters', () => {
      const raw = '\u200B\u200B[整理搬运] 猫眼三姐妹 (Kyattsu Ai)：TV动画';
      const p = parseDmhyTitle(raw);
      expect(p.title).toBe('猫眼三姐妹');
    });
  });
});
