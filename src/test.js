function fnCheckDayTm() {
  $("#calCheck").val('Y');
  $("#unitCheck").val('Y');
  // 이용 시간 단위
  var k = $('[name=use_time_unit_code]').val();
  // 선택 가능 여부
  var checkFlag = true;
  // 처음, 끝 날짜
  var st, et;
  // 예약가능수량(최초는 최대예약가능수량, 최소예약가능수량으로 셋팅)
  var reqst_mxmm_value = 1;
  var reqst_mumm_value = 1;
  // 팀면동일때 사용하는 값
  // 사용인원제한사용가부;
  var use_nmpr_lmtt_yn = '0';
  // 사용인원최소값
  var use_lmtt_mumm_nmpr = '0';
  // 사용인원최대값
  var use_lmtt_mxmm_nmpr = '0';

  // 비정형인경우
  if ($('[name=tme_ty_code]').val() == 'TM02') {
    var use_date = '';

    // 현재 설정된 날짜에서 이용일자 만큼 더해서 이용가능 여부 확인
    for (var i = 0; i < $('[name=form_cal]').val(); i++) {
      var dt = moment($('[id^=calendar_].on a').data('ymd'), 'YYYYMMDD').add(i, 'days');

      if (!$('#calendar_' + dt.format('YYYYMMDD')).hasClass('able')) {
        alert('예약할 수 없는 날짜입니다.');
        fnDelDayTm();
        return false;
      }
      // 일단위인경우
      if (k == 'B403') {
        // 처음 날짜 셋팅
        if (i == 0) {
          $('#startday').text(dt.format('YYYY.MM.DD'));
          use_date += dt.format('YYYY.MM.DD') + '<br/> ~ ';
        }
        // 마지막 날짜 셋팅
        if (i == $('[name=form_cal]').val() - 1) {
          $('#endday').text(dt.format('YYYY.MM.DD'));

          // 이용일자 셋팅
          use_date += dt.format('YYYY.MM.DD') + '(' + $('[name=form_cal]').val() + '일)';
        }
      }
      // 박단위인경우
      else if (k == 'B409') {
        // 처음 날짜 셋팅
        if (i == 0) {
          $('#nightday').text(dt.format('YYYY.MM.DD'));
          use_date += dt.format('YYYY.MM.DD') + '<br/> ~ ';
        }
        // 마지막 날짜 셋팅
        if (i == $('[name=form_cal]').val() - 1) {
          // 박은 하루더해서 보여준다.
          dt.add(1, 'days');
          $('#nightuseday').html(use_date + dt.format('YYYY.MM.DD'));

          // 이용일자 셋팅
          use_date += dt.format('YYYY.MM.DD') + '(' + $('[name=form_cal]').val() + '박)';
        }
      }
    }

    $('.usedate').html(use_date);
  }
  // 정형인경우; 이용기간 전체 서비스인경우(정형회차로 만들어짐)
  else {
    // 날짜 셋팅
    var d = moment($('[id^=calendar_].able.on a').data('ymd'), 'YYYYMMDD');
    $('#nightday, .usedate').html(d.format('YYYY.MM.DD'));
  }

  // 취소 수수료 조회; 선택된 맨앞 날짜로 셋팅
  fnSelectCancelFee($('[id^=calendar_].able.on a').data('ymd'), $('[name=rsv_svc_id]').val());

  // 예약가능한 상태인경우
  if (checkFlag) {
    // 사용일시, 예약단위일련 셋팅
    $('.resveInput input').remove();

    // 현재 설정된 날짜에서 이용일자 만큼 더해서 정보셋팅
    for (var i = 0; i < $('[name=form_cal]').val(); i++) {
      var dt = moment($('[id^=calendar_].on a').data('ymd'), 'YYYYMMDD').add(i, 'days');

      $('.resveInput').append('<input type="hidden" name="resve_unit_seq" value="' + $('#cal_' + dt.format('YYYYMMDD')).data('resve_unit_seq') + '" />');
      $('.resveInput').append('<input type="hidden" name="useDe" value="' + $('#cal_' + dt.format('YYYYMMDD')).data('ymd') + '" />');

      // 선택한 회차중에 가장 예약할수 있는 수량이 작은것으로 셋팅
      var p_val = $('#cal_' + dt.format('YYYYMMDD')).data('resve_posbl_unit_value');

      // 선택한 회차중에 가장 예약할수 있는 수량이 작은것으로 셋팅
      // 선택한 회차의 예약최대값과 현재 계산된 예약최대값을 비교하여 수량이 작은것으로 셋팅
      var cur_max_val = $('#cal_' + dt.format('YYYYMMDD')).data('reqst_mxmm_value');
      var cur_min_val = $('#cal_' + dt.format('YYYYMMDD')).data('reqst_mumm_value');

      // 처음이 아닌경우; 처음회차에서 reqst_mxmm_value 가 정해짐
      // 전회차에서 정해진 최대값과 현재 회차의 최대값을 비교하여 작은수량을 셋팅
      if (i != 0) {
        cur_max_val = reqst_mxmm_value < cur_max_val ? reqst_mxmm_value : cur_max_val;
        cur_min_val = reqst_mumm_value > cur_min_val ? reqst_mumm_value : cur_min_val;
      }

      reqst_mxmm_value = cur_max_val < p_val ? cur_max_val : p_val;
      // 선택한 회차의 가장 높은 최소선택수량을 선택
      reqst_mumm_value = cur_min_val;

      // 팀면동 단위일때 사용하는 변수값
      // 맨마지막 회차의 설정값으로 가져온다.
      use_nmpr_lmtt_yn = $('#cal_' + dt.format('YYYYMMDD')).data('use_nmpr_lmtt_yn');
      // 사용인원최소값
      use_lmtt_mumm_nmpr = parseInt($('#cal_' + dt.format('YYYYMMDD')).data('use_lmtt_mumm_nmpr'), 10);
      // 사용인원최대값
      use_lmtt_mxmm_nmpr = parseInt($('#cal_' + dt.format('YYYYMMDD')).data('use_lmtt_mxmm_nmpr'), 10);


      // 처음, 끝 날짜 셋팅
      if (i == 0) {
        $('#start_date').val(dt.format('YYYYMMDD'));
      }
      if (i == $('[name=form_cal]').val() - 1) {
        $('#end_date').val(dt.format('YYYYMMDD'));
      }
    }

    var return_flag = true;

    // 중복예약가능한지 확인 조회
    $.ajax({
      type: 'POST',
      dataType: 'json',
      url: '/web/reservation/selectReservRsvCountLimitYnAjax.do',
      async: false,
      data: $('.resveInput input, [name=rsv_svc_id]').serialize(),
      success: function (param) {
        // 예약 불가능한경우
        if (param.resultStats.resultCode == "error") {
          alert(param.resultStats.resultMsg);
          return_flag = false;
          return fnDelDayTm();
        }

        // 현재 선택한 회차중에 가장 예약가능수량이 작은것으로 인원수량을 체크할수 있도록 값 셋팅
        $('#reqst_mxmm_value').val(reqst_mxmm_value);
        $('#reqst_mumm_value').val(reqst_mumm_value);
        // 사용인원제한사용가부 설정
        $('#use_nmpr_lmtt_yn').val(use_nmpr_lmtt_yn);
        // 사용인원최소값
        $('#use_lmtt_mumm_nmpr').val(use_lmtt_mumm_nmpr);
        // 사용인원최대값
        $('#use_lmtt_mxmm_nmpr').val(use_lmtt_mxmm_nmpr);

        // 현재 설정된 팀 신청 인원보다 최소인원이 큰경우 최소인원으로 셋팅
        if (use_lmtt_mumm_nmpr > parseInt($('[name=user_req_cnt]').val(), 10)) {
          $('.user_req_cnt_str').text(use_lmtt_mumm_nmpr);
          $('[name=user_req_cnt]').val(use_lmtt_mumm_nmpr);
        }

        // 현재 설정된 팀 신청 인원보다 최대인원이 큰경우 최대인원으로 셋팅
        if (use_lmtt_mxmm_nmpr < parseInt($('[name=user_req_cnt]').val(), 10)) {
          $('.user_req_cnt_str').text(use_lmtt_mxmm_nmpr);
          $('[name=user_req_cnt]').val(use_lmtt_mxmm_nmpr);
        }

        // 팀 신청 인원값이 있는경우 팀신청인원 영역을 보여준다.
        if (use_lmtt_mumm_nmpr > 0 && use_lmtt_mxmm_nmpr > 0) {
          $('#team_area_cnt_box').removeClass('dpNone');
          // 추가이용자 정보 추가
          fnUserInfo();
        }

        // 요청 시간 설정; 요금계산에 쓰임
        $('[name=req_time]').val($('[name=form_cal]').val());
        // 요금 계산
        fnAmount();

        // 예약가능한 구역 리스트 조회
        $.ajax({
          type: 'POST',
          dataType: 'json',
          url: '/web/reservation/selectReservChairAjax.do',
          async: false,
          data: $('.resveInput input, [name=rsv_svc_id]').serialize(),
          success: function (param) {
            if (param.resultStats.resultCode == "error") {
              alert(param.resultStats.resultMsg);
              return_flag = false;
              return false;
            }

            // 기존에 선택되어진 좌석 번호
            var sel_zone_seq = $('[name=zone_seq]').val();
            // 좌석 선택 초기화
            $('#zoneCheck').val('N');
            $('#zone_seq').val('');

            var chair_str = "";

            if (param.resultList.length == 0) {
              chair_str += '<li>구역선택</li>';
            } else {
              for (var i = 0; i < param.resultList.length; i++) {
                // 사용할수 없는 구역인경우
                if (param.resultList[i].CHOICE_YN != 'Y') {
                  chair_str += '<li class="disable">';
                }
                // 사용할수 있는 구역인경우
                else {
                  chair_str += '<li id="chair' + i + '" class="chair-all">';
                  chair_str += '<a href="javascript:void(0);" data-zone_seq="' + param.resultList[i].ZONE_SEQ + '">';
                }

                chair_str += param.resultList[i].ZONE_NM + '</a></li>';
              }
            }

            $("#chair").html(chair_str);

            // 기존에 선택되어진 좌석 클릭
            if (sel_zone_seq != '') {
              $('.chair-all [data-zone_seq=' + sel_zone_seq + ']').trigger('click');
            }
          },
          error: function (jqXHR, textStatus, thrownError) {
            ajaxJsonErrorAlert(jqXHR, textStatus, thrownError)
          }
        });

      },
      error: function (jqXHR, textStatus, thrownError) {
        ajaxJsonErrorAlert(jqXHR, textStatus, thrownError)
      }
    });
  }

  return return_flag;
}